<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="공정 목록">
    <div class="d-flex align-center mb-4">
      <v-text-field label="공정 검색" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 280px"></v-text-field>
      <v-btn color="darkText" @click="searchData">검색</v-btn>
      <v-row justify="end" class="mr-3">
        <v-btn color="error" class="mr-1" @click="del">삭제</v-btn>
      </v-row>
    </div>
    <div class="main-container">
      <div class="list-container">
        <ag-grid-vue
          :rowData="rowData1"
          :columnDefs="colDefs1"
          :theme="quartz"
          style="height: 500px; width: 100%"
          @cell-value-changed="onCellValueChanged"
          @rowClicked="onRowClicked"
          rowSelection="single"
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
      </div>
      <div class="form-wrapper">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field label="공정코드" v-model="form.prcCode" readonly="true" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="공정명" v-model="form.prcName" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="작성자" v-model="form.writer" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="등록일자" v-model="form.date" type="date" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="설비유형" v-model="form.type" dense outlined readonly>
                <template #append-inner>
                  <i
                    class="fa-solid fa-magnifying-glass"
                    style="cursor: pointer; font-size: large; margin-right: 0.5rem"
                    @click="openModal('설비 조회', materialRowData, materialColDefs)"
                  ></i>
                </template>
              </v-text-field>
              <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
            </v-col>
            <v-col cols="4"> </v-col>
            <v-col cols="12">
              <v-text-field label="비고" v-model="form.note" dense outlined />
            </v-col>

            <v-row justify="center">
              <v-btn color="error" class="mr-3" @click="resetForm">초기화</v-btn>
              <v-btn color="primary" class="mr-6" @click="submitForm">저장</v-btn>
            </v-row>
          </v-row>
        </div>
        <br />
      </div>
    </div>
  </UiParentCard>
</template>

<script setup>
// 기존 스크립트 내용은 동일합니다.
import { ref, shallowRef, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axios from 'axios';
import MoDal from '../common/NewModal.vue';

// 토스트
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-bootstrap.css';
const $toast = useToast();

// 로그인 세션 정보
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();

//{ position: 'top-right', duration: 1000 }

const quartz = themeQuartz;

const today = new Date().toISOString().split('T')[0];
const form = ref({
  prcCode: '', //
  prcName: '',
  writer: authStore.user?.name || '',
  date: today,
  type: '',
  note: ''
});

// 제품 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  {
    checkboxSelection: true, // 각 행에 체크박스
    width: 50
  },
  { field: '공정코드', editable: true, width: 140 },
  { field: '공정명', width: 140, editable: true },
  { field: '설비유형', width: 140, editable: true },
  { field: '작성자', width: 130, editable: true },
  { field: '등록일자', width: 130, editable: true },
  { field: '비고', width: 130, editable: true }
]);

const page = ref({ title: '공정 관리' });
const breadcrumbs = shallowRef([
  {
    title: '기준정보',
    disabled: true,
    href: '#'
  },
  {
    title: '공정 관리',
    disabled: false,
    href: '#'
  }
]);

// 제품 리스트
const prcList = async () => {
  const res = await axios.get('/masterPrcSelect');
  console.log(res);
  rowData1.value = res.data.map((prd) => ({
    공정코드: prd.PRC_CODE,
    공정명: prd.PRC_NAME,
    설비유형: prd.FAC_TYPE,
    작성자: prd.PRC_WRITER,
    등록일자: prd.PRC_RDATE ? prd.PRC_RDATE.substring(0, 10) : null,
    비고: prd.PRC_NOTE
  }));
};

onMounted(() => {
  prcList();
  modalList();
});
// 저장버튼
const submitForm = async () => {
  try {
    // 중복 체크 (클라이언트)
    const exists = rowData1.value.some((item) => item.공정명 === form.value.prcName);

    // 신규 등록 시 중복이면 막기
    if (!form.value.prcCode && exists) {
      $toast.warning('이미 등록된 공정명입니다.', { position: 'top-right', duration: 1000 });
      return;
    }

    // 필수 입력 체크
    if (!form.value.type || !form.value.prcName) {
      $toast.warning('공정명과 설비유형을 입력해주세요.', { position: 'top-right', duration: 1000 });
      return;
    }

    if (form.value.prcCode) {
      // 수정
      const updateRow = {
        PRC_NAME: form.value.prcName,
        PRC_TYPE: form.value.type,
        PRC_WRITER: form.value.writer,
        PRC_DATE: form.value.date,
        PRC_NOTE: form.value.note,
        PRC_CODE: form.value.prcCode
      };
      await axios.post('/masterPrcUpdate', updateRow);
      $toast.success('공정이 수정되었습니다.', { position: 'top-right', duration: 1000 });
      await prcList();
    } else {
      // 신규 등록
      const newRow = {
        PRC_NAME: form.value.prcName,
        FAC_TYPE: form.value.type,
        PRC_WRITER: form.value.writer,
        PRC_RDATE: form.value.date,
        PRC_NOTE: form.value.note
      };
      await axios.post('/masterPrcInsert', newRow);
      $toast.success('공정이 등록되었습니다.', { position: 'top-right', duration: 1000 });
      await prcList();
    }
  } catch (err) {
    console.error(err);
    $toast.error('저장 중 오류가 발생했습니다.', { position: 'top-right', duration: 1000 });
  }
};

const del = async () => {
  if (!form.value.prcCode) {
    $toast.warning('삭제할 공정을 선택하세요.', { position: 'top-right', duration: 1000 });
    return;
  }
  try {
    await axios.post('/masterPrcDelete', { PRC_CODE: form.value.prcCode });
    $toast.success(`${form.value.prcName}(이)가 삭제되었습니다.`, { position: 'top-right', duration: 1000 });

    resetForm();
  } catch {
    $toast.error('삭제 중 오류가 발생했습니다.', { position: 'top-right', duration: 1000 });
  }
};

// 검색
const searchKeyword = ref('');
const searchData = async () => {
  if (!searchKeyword.value) {
    $toast.warning('공정이 입력되지 않았습니다', { position: 'top-right', duration: 1000 });
    return;
  }
  const condition = { PRC_NAME: searchKeyword.value };
  const res = await axios.post('/masterPrcSearch', condition);
  rowData1.value = res.data.map((prd) => ({
    공정코드: prd.PRC_CODE,
    공정명: prd.PRC_NAME,
    설비유형: prd.FAC_TYPE,
    작성자: prd.PRC_WRITER,
    등록일자: prd.PRC_RDATE ? prd.PRC_RDATE.substring(0, 10) : null,
    비고: prd.PRC_NOTE
  }));
  $toast.success('검색이 완료되었습니다.', { position: 'top-right', duration: 1000 });
};

// 폼 데이터를 초기화하는 함수
const resetForm = () => {
  form.value.prcCode = '';
  form.value.prcName = '';
  form.value.date = today;
  form.value.note = '';
  form.value.type = '';
  form.value.writer = authStore.user?.name || '';
  // writer와 date는 그대로 유지
  prcList();
};

// 행선택시 등록 폼으로
const onRowClicked = (event) => {
  form.value.prcCode = event.data.공정코드;
  form.value.prcName = event.data.공정명;
  form.value.writer = event.data.작성자;
  form.value.date = event.data.등록일자;
  form.value.type = event.data.설비유형;
  form.value.note = event.data.비고;
};

//모달 value들
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
const materialColDefs = [
  { field: '그룹코드', headerName: '그룹코드', flex: 1 },
  { field: '설비유형', headerName: '설비유형', flex: 1 },
  { field: '사용유무', headerName: '사용유무', flex: 1 }
];
const materialRowData = ref([]);

// 모달 조회
const modalList = async () => {
  const res = await axios.get('/masterPrcModal');
  materialRowData.value = res.data.map((prd) => ({
    그룹코드: prd.group_code,
    설비유형: prd.code_name,
    사용유무: prd.use_yn
  }));
  console.log(res);
};

//모달 열때 데이터값 자식컴포넌트로
const openModal = async (title, rowData, colDefs) => {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  if (modalRef.value) {
    modalRef.value.open();
  }
};

// 모달에서 확인시 행추가
const modalConfirm = async (selectedRow) => {
  form.value.type = selectedRow.설비유형;
};
</script>

<style scoped>
.main-container {
  display: flex;
  gap: 20px; /* 두 컨테이너 사이의 간격 */
  padding: 0 10px;
}

.list-container {
  flex: 1 1 50%; /* flex-grow: 1, flex-shrink: 1, flex-basis: 50% */
  min-width: 400px;
}

.form-wrapper {
  flex: 1 1 50%; /* list-container와 동일하게 공간을 차지 */
  min-width: 400px;
}
.radioDiv {
  margin-left: 1rem;
}
</style>
