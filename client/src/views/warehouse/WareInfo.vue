<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="창고 조회">
    <div class="d-flex align-center mb-4">
      <v-row justify="start">
        <v-btn color="warning" class="ml-4" @click="openModal('창고 목록', materialRowData, materialColDefs)" style="margin-bottom: 2rem"
          >창고 등록 및 조회
        </v-btn>
        <MoDal2
          ref="modalRef"
          :title="modalTitle"
          :rowData="modalRowData"
          :colDefs="modalColDefs"
          @confirm="modalConfirm"
          @deleted="modalList"
          @update="modalList"
        />
      </v-row>
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
          :rowMultiSelectWithClick="true"
          @rowClicked="onRowClicked"
          @grid-ready="onGridReady"
          :pagination="true"
          :pagination-page-size="20"
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
      </div>
      <div class="form-wrapper">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field label="창고번호" v-model="form.wrNo" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="창고 이름" v-model="form.wrName" dense outlined />
            </v-col>
            <v-col cols="12">
              <v-text-field label="창고 주소" v-model="form.wrAddr" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="구역번호" v-model="form.dtNo" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="섹션코드" v-model="form.secCode" readonly="true" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="품목코드"
                @click="pmModal('품목 조회', materialRowData1, materialColDefs1)"
                v-model="form.code"
                dense
                outlined
                readonly="true"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                label="품목유형"
                @click="pmModal('품목 조회', materialRowData1, materialColDefs1)"
                v-model="form.type"
                readonly="true"
              />
            </v-col>
          </v-row>
          <MoDal ref="modalRef1" :title="modalTitle1" :rowData="modalRowData1" :colDefs="modalColDefs1" @confirm="pmConfirm" />
        </div>
        <div class="d-flex align-center mb-4">
          <v-row justify="center" class="mr-3">
            <v-btn color="error" class="mr-3" @click="resetForm">초기화</v-btn>
            <v-btn color="primary" class="mr-6" @click="submitForm">저장</v-btn>
          </v-row>
        </div>
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
import MoDal2 from './WrModal.vue'; // 창고모달
import axios from 'axios';
import MoDal from '../common/NewModal.vue';

// 토스트;
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-bootstrap.css';
const $toast = useToast();

// 로그인 세션 정보
//import { useAuthStore } from '@/stores/auth';
//const authStore = useAuthStore();

const quartz = themeQuartz;

onMounted(() => {
  modalList();
  PMmodalList();
});

const form = ref({ wrNo: '', wrName: '', wrAddr: '', secCode: '', dtNo: '', code: '', type: '' });
// 창고 정보 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  {
    headerCheckboxSelection: true, // 헤더에서 전체 선택 가능
    checkboxSelection: true, // 각 행에서 선택 가능
    width: 50
  },
  { field: '구역번호', flex: 1, editable: true },
  { field: '섹션코드', flex: 1, editable: true },
  { field: '품목코드', flex: 1, editable: true },
  { field: '품목유형', flex: 1, editable: true }
]);

const page = ref({ title: '창고 관리' });
const breadcrumbs = shallowRef([
  {
    title: '물류',
    disabled: true,
    href: '#'
  },
  {
    title: '창고 관리',
    disabled: false,
    href: '#'
  }
]);

//cell 단위 수정
const onCellValueChanged = (event) => {
  console.log(event.value);
  console.log(rowData1.value);
};

// 그리드 api에 값 저장
let gridApi = null;

const onGridReady = (params) => {
  gridApi = params.api;
};
//모달 value들
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
// 모달 열 정의.
const materialColDefs = [
  {
    headerCheckboxSelection: true,
    checkboxSelection: true,
    flex: 0.5
  },
  { field: '창고번호', headerName: '창고번호', readonly: 'true', flex: 1 },
  { field: '창고명', headerName: '창고명', flex: 1, editable: true },
  { field: '창고주소', headerName: '창고주소', flex: 3, editable: true }
];

// 모달행에 들어갈 값.
const materialRowData = ref([]);

// 모달 조회
const modalList = async () => {
  const res = await axios.get('http://localhost:3000/wrModalSelect');
  materialRowData.value = res.data.map((prd) => ({
    창고번호: prd.WR_NO,
    창고명: prd.WR_NAME,
    창고주소: prd.WR_ADDR
  }));
};

const openModal = (title, rowData, colDefs) => {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  if (modalRef.value) {
    modalRef.value.open();
  }
};

// 모달에서 확인시 행추가
const modalConfirm = async (selectedRow) => {
  console.log(selectedRow);
  form.value.wrNo = selectedRow.창고번호;
  form.value.wrName = selectedRow.창고명;
  form.value.wrAddr = selectedRow.창고주소;
  // 조회
  wrInfo();
};
//전체조회
async function wrInfo() {
  const condition = { WR_NO: form.value.wrNo };
  const res = await axios.post('http://localhost:3000/wrSelect', condition);
  rowData1.value = res.data.map((prd) => ({
    구역번호: prd.WR_AREANO,
    섹션코드: prd.WR_SECTION,
    품목코드: prd.WR_PRD_ID,
    품목유형: prd.WR_TYPE
  }));
}
////////////////////////////

// 품목 모달
const modalRef1 = ref(null);
const modalTitle1 = ref('');
const modalRowData1 = ref([]);
const modalColDefs1 = ref([]);
// 모달 열 정의.
const materialColDefs1 = [
  {
    headerCheckboxSelection: true,
    checkboxSelection: true,
    flex: 0.5
  },
  { field: '품목코드', headerName: '품목코드', flex: 1, editable: true },
  { field: '품목유형', headerName: '품목유형', flex: 1, editable: true }
];

// 모달행에 들어갈 값.
const materialRowData1 = ref([]);

const pmModal = (title, rowData, colDefs) => {
  modalTitle1.value = title;
  modalRowData1.value = rowData;
  modalColDefs1.value = colDefs;
  if (modalRef1.value) {
    modalRef1.value.open();
  }
};

// 모달 조회
const PMmodalList = async () => {
  const res = await axios.get('http://localhost:3000/InfoModal');
  materialRowData1.value = res.data.map((prd) => ({
    품목코드: prd.code,
    품목유형: prd.code_name
  }));
};

const pmConfirm = async (selectedRow) => {
  console.log(selectedRow);
  form.value.code = selectedRow.품목코드;
  form.value.type = selectedRow.품목유형;
};

const onRowClicked = (event) => {
  form.value.secCode = event.data.섹션코드;
  form.value.dtNo = event.data.구역번호;
  form.value.code = event.data.품목코드;
  form.value.type = event.data.품목유형;
};
const resetForm = () => {
  form.value.secCode = '';
  form.value.dtNo = '';
  form.value.code = '';
  form.value.type = '';
};

// 저장버튼
const submitForm = async () => {
  try {
    // 중복 체크 (클라이언트)
    const exists = rowData1.value.some((item) => item.섹션코드 === form.value.secCode);

    // 신규 등록 시 중복이면 막기
    if (!form.value.secCode && exists) {
      $toast.warning('이미 등록된 섹션코드입니다.', { position: 'top-right', duration: 1000 });
      return;
    }

    // 필수 입력 체크
    if (!form.value.type || !form.value.dtNo) {
      $toast.warning('구역번호와 유형을 입력하세요.', { position: 'top-right', duration: 1000 });
      return;
    }

    if (form.value.secCode) {
      // 수정
      const updateRow = {
        WR_AREANO: form.value.dtNo.toUpperCase(),
        WR_SECTION: form.value.secCode,
        WR_PRD_ID: form.value.code,
        WR_TYPE: form.value.type,
        WR_NO: form.value.wrNo
      };
      await axios.post('http://localhost:3000/wrInfoUpdate', updateRow);
      $toast.success('창고가 수정되었습니다.', { position: 'top-right', duration: 1000 });
      await wrInfo();
    } else {
      // 신규 등록
      const newRow = {
        WR_AREANO: form.value.dtNo.toUpperCase(),
        WR_PRD_ID: form.value.code,
        WR_TYPE: form.value.type,
        WR_NO: form.value.wrNo
      };
      await axios.post('http://localhost:3000/wrInfoInsert', newRow);
      $toast.success('구역이 추가되었습니다.', { position: 'top-right', duration: 1000 });
      await wrInfo();
    }
  } catch (err) {
    console.error(err);
    $toast.error('저장 중 오류가 발생했습니다.', { position: 'top-right', duration: 1000 });
  }
};

// 사원 삭제
const del = async () => {
  const selectedRows = gridApi.getSelectedRows();
  console.log(selectedRows);
  if (selectedRows.length === 0) {
    $toast.warning('삭제할 구역을 선택하세요', { position: 'top-right', duration: 1000 });
    return;
  }
  const deleteRow = { WR_SECTION: selectedRows[0].섹션코드 };

  if (confirm('구역을 삭제하시겠습니까?')) {
    await axios.post('http://localhost:3000/wrDelete', deleteRow);
    $toast.success('삭제 완료', { position: 'top-right', duration: 1000 });
    await wrInfo();
    resetForm();
  } else {
    console.log('삭제취소');
  }
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
