<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="제품 목록">
    <div class="d-flex align-center mb-4">
      <v-text-field label="제품 검색" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 280px"></v-text-field>
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
        ></ag-grid-vue>
      </div>
      <div class="form-wrapper">
        <div class="add">
          <v-row class="mb-4">
            <v-col cols="6">
              <v-text-field label="제품코드" v-model="form.prdCode" readonly dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="제품명" v-model="form.prdName" dense outlined />
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
                    @click="openModal('제품 규격 조회', materialRowData, materialColDefs)"
                  ></i>
                </template>
              </v-text-field>
              <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
            </v-col>
            <v-col cols="6">
              <v-text-field label="안전재고" v-model="form.safeQT" type="number" min="0" outlined />
            </v-col>
            <v-col cols="6">
              <v-select label="단위" v-model="form.unit" :items="unitOptions" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-select label="제품유형" v-model="form.type" :items="typeOptions" dense outlined />
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
      </div>
    </div>
  </UiParentCard>
</template>

<script setup>
import { onMounted, ref, shallowRef } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axios from 'axios';
import MoDal from '../common/NewModal.vue';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-bootstrap.css';
import { useAuthStore } from '@/stores/auth';
const $toast = useToast();
const authStore = useAuthStore();

const quartz = themeQuartz;

const today = new Date().toISOString().split('T')[0];
const form = ref({
  prdCode: '',
  prdName: '',
  writer: authStore.user?.name || '',
  date: today,
  size: '',
  safeQT: '',
  unit: '',
  type: '',
  note: ''
});

const rowData1 = ref([]);
const colDefs1 = ref([
  {
    checkboxSelection: true, // 각 행에 체크박스
    width: 50
  },
  { field: '제품코드', editable: true, width: 140 },
  { field: '제품명', width: 140, editable: true },
  { field: '제품유형', width: 140, editable: true },
  { field: '규격', width: 140, editable: true },
  { field: '단위', width: 130, editable: true },
  {
    field: '안전재고',
    flex: 1,
    editable: true
  },
  { field: '작성자', width: 110 },
  { field: '등록일자', width: 110 },
  { field: '비고', width: 110, editable: true }
]);

const page = ref({ title: '제품 관리' });
const breadcrumbs = shallowRef([
  { title: '기준정보', disabled: true, href: '#' },
  { title: '제품 관리', disabled: false, href: '#' }
]);

// 단위, 유형 드롭박스
const unitOptions = ref([]);
const typeOptions = ref([]);

// 모달
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

// 그리드 API
const gridApiMat = ref(null);

onMounted(() => {
  prdList();
  modalList();
  unitList();
  typeList();
});

const prdList = async () => {
  const res = await axios.get('/masterPrdSelect');
  rowData1.value = res.data.map((prd) => ({
    제품코드: prd.PRD_CODE,
    제품명: prd.PRD_NAME,
    제품유형: prd.PRD_TYPE,
    규격: prd.PRD_SIZE,
    단위: prd.PRD_UNIT,
    안전재고: prd.PRD_SAFEQT,
    작성자: prd.PRD_WRITER,
    등록일자: prd.PRD_DATE.substring(0, 10),
    비고: prd.PRD_NOTE
  }));
};

const unitList = async () => {
  const res = await axios.get('/masterPrdUnit');
  unitOptions.value = res.data.map((prd) => prd.code_name);
};
const typeList = async () => {
  const res = await axios.get('/masterPrdType');
  typeOptions.value = res.data.map((prd) => prd.code_name);
};

const submitForm = async () => {
  if (!form.value.safeQT || !form.value.type) {
    $toast.warning('값을 올바르게 기재하십시오.', { position: 'top-right', duration: 1000 });
    return;
  }

  if (form.value.prdCode) {
    const updateRow = {
      PRD_NAME: form.value.prdName,
      PRD_TYPE: form.value.type,
      PRD_UNIT: form.value.unit,
      PRD_SIZE: form.value.size,
      PRD_SAFEQT: form.value.safeQT,
      PRD_WRITER: form.value.writer,
      PRD_DATE: form.value.date,
      PRD_NOTE: form.value.note,
      PRD_CODE: form.value.prdCode
    };
    await axios.post('/masterPrdUpdate', updateRow);
    $toast.success('제품이 수정되었습니다.', { position: 'top-right', duration: 1000 });
  } else {
    const exists = rowData1.value.find((p) => p.제품명 === form.value.prdName);
    if (exists) {
      $toast.warning('이미 등록된 제품입니다.', { position: 'top-right', duration: 1000 });
      return;
    }

    const newRow = {
      PRD_NAME: form.value.prdName,
      PRD_TYPE: form.value.type,
      PRD_UNIT: form.value.unit,
      PRD_SIZE: form.value.size,
      PRD_SAFEQT: form.value.safeQT,
      PRD_WRITER: form.value.writer,
      PRD_DATE: form.value.date,
      PRD_NOTE: form.value.note
    };
    await axios.post('/masterPrdInsert', newRow);
    $toast.success('제품이 등록되었습니다.', { position: 'top-right', duration: 1000 });
  }

  await prdList();
};

const del = async () => {
  const selectedRows = gridApiMat.value.getSelectedRows();
  if (selectedRows.length === 0) {
    $toast.warning('삭제할 제품을 선택하세요.', { position: 'top-right', duration: 1000 });
    return;
  }
  if (!confirm(`${selectedRows.map((r) => r.제품명).join(', ')}을 삭제하시겠습니까?`)) return;

  const prdCode = selectedRows.map((r) => r.제품코드);
  await axios.post('/masterPrdDelete', { prdCode });
  await prdList();
  $toast.success('제품이 삭제되었습니다.', { position: 'top-right', duration: 1000 });
};

const searchKeyword = ref('');
const searchData = async () => {
  if (!searchKeyword.value) {
    $toast.warning('제품이 입력되지 않았습니다', { position: 'top-right', duration: 1000 });
    return;
  }
  const condition = { PRD_NAME: searchKeyword.value };
  const res = await axios.post('/masterPrdSearch', condition);
  rowData1.value = res.data.map((prd) => ({
    제품코드: prd.PRD_CODE,
    제품명: prd.PRD_NAME,
    제품유형: prd.PRD_TYPE,
    규격: prd.PRD_SIZE,
    단위: prd.PRD_UNIT,
    안전재고: prd.PRD_SAFEQT,
    작성자: prd.PRD_WRITER,
    등록일자: prd.PRD_DATE.substring(0, 10),
    비고: prd.PRD_NOTE
  }));
  $toast.success('검색이 완료되었습니다.', { position: 'top-right', duration: 1000 });
};

const resetForm = () => {
  form.value = {
    prdCode: '',
    prdName: '',
    writer: authStore.user?.name || '',
    date: today,
    size: '',
    safeQT: '',
    unit: '',
    type: '',
    note: ''
  };
  // writer와 date는 유지
};

const onRowClicked = (event) => {
  form.value.prdCode = event.data.제품코드;
  form.value.prdName = event.data.제품명;
  form.value.writer = event.data.작성자;
  form.value.date = event.data.등록일자;
  form.value.safeQT = event.data.안전재고;
  form.value.size = event.data.규격;
  form.value.unit = event.data.단위;
  form.value.type = event.data.제품유형;
  form.value.note = event.data.비고;
};

const onGridReadyMat = (params) => {
  gridApiMat.value = params.api;
};

const modalList = async () => {
  const res = await axios.get('/masterPrdModal');
  materialRowData.value = res.data.map((prd) => ({
    그룹코드: prd.group_code,
    규격: prd.code_name,
    사용유무: prd.use_yn
  }));
};

const openModal = async (title, rowData, colDefs) => {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  modalRef.value?.open();
};

const modalConfirm = async (selectedRow) => {
  form.value.size = selectedRow.규격;
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
