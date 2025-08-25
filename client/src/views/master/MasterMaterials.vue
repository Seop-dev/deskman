<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="자재 목록">
    <div class="d-flex align-center mb-4">
      <v-text-field label="자재 검색" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 280px"></v-text-field>
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
          rowSelection="single"
          @rowClicked="onRowClicked"
          @grid-ready="onGridReadyMat"
        >
        </ag-grid-vue>
      </div>
      <div class="form-wrapper">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field label="자재코드" v-model="form.matCode" readonly="true" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="자재명" v-model="form.matName" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="작성자" v-model="form.writer" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="등록일자" v-model="form.date" type="date" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="규격" v-model="form.size" placeholder="규격" dense outlined readonly>
                <template #append-inner>
                  <i
                    class="fa-solid fa-magnifying-glass"
                    style="cursor: pointer; font-size: large; margin-right: 0.5rem"
                    @click="openModal('자재 규격 조회', materialRowData, materialColDefs)"
                  ></i>
                </template>
              </v-text-field>
              <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
            </v-col>
            <v-col cols="6">
              <v-text-field label="안전재고" v-model="form.safeQT" type="number" min="0" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-select label="단위" v-model="form.unit" :items="unitOptions" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-select label="자재유형" v-model="form.type" :items="typeOptions" dense outlined />
            </v-col>
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

const quartz = themeQuartz;

const today = new Date().toISOString().split('T')[0];
const form = ref({
  matCode: '',
  matName: '',
  writer: authStore.user?.name || '',
  date: today,
  size: '',
  safeQT: '',
  unit: '',
  type: '',
  note: ''
});

onMounted(() => {
  matList();
  modalList();
  typeList();
  unitList();
});

// 제품 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  {
    checkboxSelection: true, // 각 행에 체크박스
    width: 50
  },
  { field: '자재코드', width: 140 },
  { field: '자재명', width: 140 },
  { field: '자재유형', width: 140 },
  { field: '규격', width: 140 },
  { field: '안전재고', width: 130 },
  { field: '단위', width: 130 },
  { field: '작성자', width: 130 },
  { field: '등록일자', width: 130 },
  { field: '비고', width: 130 }
]);

const page = ref({ title: '자재 관리' });
const breadcrumbs = shallowRef([
  { title: '기준정보', disabled: true, href: '#' },
  { title: '자재 관리', disabled: false, href: '#' }
]);

//cell 단위 수정
const onCellValueChanged = (event) => {
  console.log(event.value);
  console.log(rowData1.value);
};

// 제품 리스트
const matList = async () => {
  const res = await axios.get('/masterMatSelect');
  rowData1.value = res.data.map((prd) => ({
    자재코드: prd.MAT_CODE,
    자재명: prd.MAT_NAME,
    자재유형: prd.MAT_TYPE,
    규격: prd.MAT_SIZE,
    단위: prd.MAT_UNIT,
    안전재고: prd.MAT_SAFEQT,
    작성자: prd.MAT_WRITER,
    등록일자: prd.MAT_DATE.substring(0, 10),
    비고: prd.MAT_NOTE
  }));
};

// 단위, 유형 드롭박스
const unitOptions = ref([]);
const typeOptions = ref([]);
const unitList = async () => {
  const unitRes = await axios.get('/masterMatUnit');
  unitOptions.value = unitRes.data.map((prd) => prd.code_name);
};
const typeList = async () => {
  const typeRes = await axios.get('/masterMatType');
  typeOptions.value = typeRes.data.map((prd) => prd.code_name);
};

// 저장버튼
const submitForm = async () => {
  try {
    if (form.value.matCode) {
      // 수정
      const updateRow = {
        MAT_NAME: form.value.matName,
        MAT_TYPE: form.value.type,
        MAT_UNIT: form.value.unit,
        MAT_SIZE: form.value.size,
        MAT_SAFEQT: form.value.safeQT,
        MAT_WRITER: form.value.writer,
        MAT_DATE: form.value.date,
        MAT_NOTE: form.value.note,
        MAT_CODE: form.value.matCode
      };
      await axios.post('/masterMatUpdate', updateRow);
      $toast.success('자재가 수정되었습니다.', { position: 'top-right', duration: 1000 });
    } else {
      // 신규 등록
      const exists = rowData1.value.some((item) => item.자재명 === form.value.matName);
      if (!form.value.matCode && exists) {
        $toast.warning('이미 등록된 자재입니다.', { position: 'top-right', duration: 1000 });
        return; // 등록 막기
      }
      if (!form.value.safeQT || !form.value.type) {
        $toast.warning('값을 올바르게 기재하십시오.', { position: 'top-right', duration: 1000 });
        return;
      }

      const newRow = {
        MAT_NAME: form.value.matName,
        MAT_TYPE: form.value.type,
        MAT_UNIT: form.value.unit,
        MAT_SIZE: form.value.size,
        MAT_SAFEQT: form.value.safeQT,
        MAT_WRITER: form.value.writer,
        MAT_DATE: form.value.date,
        MAT_NOTE: form.value.note
      };
      await axios.post('/masterMatInsert', newRow);
      $toast.success('자재가 등록되었습니다.', { position: 'top-right', duration: 1000 });
    }
    matList();
    resetForm();
  } catch (err) {
    $toast.error('저장 중 오류가 발생했습니다.', { position: 'top-right', duration: 1000 });
    console.error(err);
  }
};

// 폼 초기화
const resetForm = () => {
  form.value = {
    matCode: '',
    matName: '',
    writer: authStore.user?.name || '',
    date: today,
    size: '',
    safeQT: '',
    unit: '',
    type: '',
    note: ''
  };
  matList();
};

// 행 선택시 등록 폼으로
const onRowClicked = (event) => {
  form.value.matCode = event.data.자재코드;
  form.value.matName = event.data.자재명;
  form.value.writer = event.data.작성자;
  form.value.date = event.data.등록일자;
  form.value.safeQT = event.data.안전재고;
  form.value.size = event.data.규격;
  form.value.unit = event.data.단위;
  form.value.type = event.data.자재유형;
  form.value.note = event.data.비고;
};

//모달 value들
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
const materialColDefs = [
  { field: '그룹코드', headerName: '그룹코드', flex: 1 },
  { field: '규격', headerName: '규격', flex: 1 },
  { field: '사용유무', headerName: '사용유무', flex: 1 }
];
const materialRowData = ref([]);

// 모달 조회
const modalList = async () => {
  const res = await axios.get('/masterMatModal');
  materialRowData.value = res.data.map((prd) => ({
    그룹코드: prd.group_code,
    규격: prd.code_name,
    사용유무: prd.use_yn
  }));
};

//모달 열때
const openModal = async (title, rowData, colDefs) => {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  if (modalRef.value) modalRef.value.open();
};

// 모달에서 확인시
const modalConfirm = async (selectedRow) => {
  form.value.size = selectedRow.규격;
  $toast.info(`규격 [${selectedRow.규격}] 선택됨`, { position: 'top-right', duration: 1000 });
};

// 삭제 (예시)
const del = async () => {
  if (!form.value.matCode) {
    $toast.warning('삭제할 자재를 선택하세요.', { position: 'top-right', duration: 1000 });
    return;
  }
  try {
    await axios.post('/masterMatDelete', { MAT_CODE: form.value.matCode });
    $toast.success(`${form.value.matName}(이)가 삭제되었습니다.`, { position: 'top-right', duration: 1000 });
    matList();
    resetForm();
  } catch {
    $toast.error('삭제 중 오류가 발생했습니다.', { position: 'top-right', duration: 1000 });
  }
};

const searchKeyword = ref('');
const searchData = async () => {
  if (!searchKeyword.value) {
    $toast.warning('자재가 입력되지 않았습니다', { position: 'top-right', duration: 1000 });
    return;
  }
  const condition = { MAT_NAME: searchKeyword.value };
  const res = await axios.post('/masterMatSearch', condition);
  rowData1.value = res.data.map((prd) => ({
    자재코드: prd.MAT_CODE,
    자재명: prd.MAT_NAME,
    자재유형: prd.MAT_TYPE,
    규격: prd.MAT_SIZE,
    단위: prd.MAT_UNIT,
    안전재고: prd.MAT_SAFEQT,
    작성자: prd.MAT_WRITER,
    등록일자: prd.MAT_DATE.substring(0, 10),
    비고: prd.MAT_NOTE
  }));
  $toast.success('검색이 완료되었습니다.', { position: 'top-right', duration: 1000 });
};
</script>

<style scoped>
.main-container {
  display: flex;
  gap: 20px;
  padding: 0 10px;
}
.list-container {
  flex: 1 1 50%;
  min-width: 400px;
}
.form-wrapper {
  flex: 1 1 50%;
  min-width: 400px;
}
.radioDiv {
  margin-left: 1rem;
}
</style>
