<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <UiParentCard title="제품 목록">
    <div class="d-flex align-center mb-4">
      <v-text-field label="제품 검색" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 280px" />
      <v-btn color="darkText" @click="searchData">검색</v-btn>
    </div>

    <div class="main-container">
      <!-- 제품 그리드 -->
      <div class="list-container">
        <ag-grid-vue
          :rowData="rowData1"
          :columnDefs="colDefs1"
          :theme="quartz"
          style="height: 500px; width: 100%"
          @cell-value-changed="onCellValueChanged"
          rowSelection="single"
          @rowClicked="onRowClicked"
          @grid-ready="onGridReadyPrd"
        />
      </div>

      <!-- 제품 폼 및 공정 그리드 -->
      <div class="form-wrapper">
        <v-row class="mb-4">
          <v-col cols="6">
            <v-text-field label="제품명" v-model="form.product" dense outlined />
          </v-col>
          <v-col cols="6">
            <v-text-field label="공정흐름도 코드" v-model="form.diagram" dense outlined />
          </v-col>
          <v-col cols="6">
            <v-text-field label="작성자" v-model="form.writer" dense outlined />
          </v-col>
          <v-col cols="6">
            <v-text-field label="등록일" v-model="form.addDate" type="date" dense outlined />
          </v-col>

          <v-row justify="center">
            <v-btn color="error" class="mr-3" @click="resetForm">초기화</v-btn>
            <v-btn color="primary" class="mr-6" @click="submitForm">등록</v-btn>
          </v-row>
        </v-row>

        <h5>공정목록</h5>
        <v-row justify="end" class="mb-4">
          <v-btn color="warning" class="mr-4" @click="openModal('공정 조회', materialRowData, materialColDefs)"> 공정 조회 </v-btn>
          <v-btn color="error" class="mr-4" @click="del">삭제</v-btn>
        </v-row>

        <!-- 모달 -->
        <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />

        <!-- 공정 그리드 -->
        <ag-grid-vue
          :rowData="prcData"
          :columnDefs="prcDefs"
          :theme="quartz"
          style="height: 250px; width: 100%"
          @cell-value-changed="onCellValueChanged"
          :rowDragManaged="true"
          :animateRows="true"
          :rowSelection="'multiple'"
          @grid-ready="onGridReadyMat"
          @row-drag-end="onRowDragEnd"
        />
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
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-bootstrap.css';
const $toast = useToast();
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();

const quartz = themeQuartz;

// 폼
const form = ref({
  product: '',
  diagram: '',
  writer: authStore.user?.name || '',
  addDate: new Date().toISOString().split('T')[0]
});

// 그리드 API
const gridApiMat = ref(null);
const gridApiPrd = ref(null);
const onGridReadyMat = (params) => (gridApiMat.value = params.api);
const onGridReadyPrd = (params) => (gridApiPrd.value = params.api);

// 제품 리스트
const rowData1 = ref([]);
const colDefs1 = ref([
  { headerCheckboxSelection: true, checkboxSelection: true, width: 50 },
  { field: '제품명', editable: true, width: 120 },
  { field: '제품코드', width: 130 },
  { field: '제품유형', width: 130 },
  { field: '공정흐름도', width: 130 },
  { field: '작성자', width: 110, editable: true },
  { field: '등록일', width: 110, editable: true }
]);

// 공정 리스트
const prcData = ref([]);
const prcDefs = ref([
  { headerCheckboxSelection: true, checkboxSelection: true, width: 50 },
  { field: '공정순서', type: Number, flex: 1, rowDrag: true, editable: true },
  { field: '공정코드', editable: true, flex: 1 },
  { field: '공정명', flex: 1 },
  { field: '설비유형', flex: 1 }
]);

const page = ref({ title: '공정흐름도 관리' });
const breadcrumbs = shallowRef([
  { title: '기준정보', disabled: true, href: '#' },
  { title: '공정흐름도 관리', disabled: false, href: '#' }
]);

// 모달
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);
const materialColDefs = [
  { field: '공정코드', headerName: '공정코드', flex: 1 },
  { field: '공정명', headerName: '공정명', flex: 1 },
  { field: '설비유형', headerName: '설비유형', flex: 1 },
  { field: '등록일자', headerName: '등록일자', flex: 1 }
];
const materialRowData = ref([]);

// onMounted
onMounted(() => {
  prdList();
  modalList();
});

// 제품 조회
const prdList = async () => {
  const res = await axios.get('http://localhost:3000/diaPrdList');
  rowData1.value = res.data.map((prd) => ({
    제품명: prd.PRD_NAME,
    제품코드: prd.PRD_CODE,
    제품유형: prd.PRD_TYPE,
    공정흐름도: prd.DIA_CODE,
    작성자: prd.PRD_WRITER,
    등록일: prd.PRD_DATE.substring(0, 10)
  }));
};

// 공정 조회
const prcList = async () => {
  if (!form.value.diagram) return;
  const res = await axios.post('http://localhost:3000/prcList', { DIA_CODE: form.value.diagram });
  prcData.value = res.data.map((prd) => ({
    공정순서: prd.PRC_ORDER,
    공정코드: prd.PRC_CODE,
    공정명: prd.PRC_NAME,
    설비유형: prd.FAC_TYPE
  }));
};

// 행 클릭
const onRowClicked = (event) => {
  form.value.product = event.data.제품명;
  form.value.diagram = event.data.공정흐름도;
  form.value.writer = event.data.작성자;
  form.value.addDate = event.data.등록일;
  prcList();
};

// 저장
const submitForm = async () => {
  const selectedRows = gridApiPrd.value.getSelectedRows();
  if (!selectedRows.length) {
    $toast.error('제품을 선택하세요', { position: 'top-right', duration: 1000 });
    return;
  }

  const alreadyAssigned = selectedRows.find((r) => r.공정흐름도);
  if (alreadyAssigned) {
    $toast.error(`이미 공정흐름도 코드가 부여된 제품입니다: ${alreadyAssigned.제품명}`, { position: 'top-right', duration: 1000 });
    return;
  }

  const prdCode = selectedRows.map((r) => r.제품코드);
  await axios.post('http://localhost:3000/diaInsert', { 제품코드: prdCode, 작성자: form.value.writer, 등록일: form.value.addDate });
  $toast.success('등록 성공', { position: 'top-right', duration: 1000 });
  prdList();
};

// 초기화
const resetForm = () => {
  form.value = {
    product: '',
    diagram: '',
    writer: authStore.user?.name || '',
    addDate: new Date().toISOString().split('T')[0]
  };
  prcData.value = [];
  $toast.info('초기화되었습니다.', { position: 'top-right', duration: 1000 });
};

// 공정 삭제
const del = async () => {
  const selectedRows = gridApiMat.value.getSelectedRows();
  if (!selectedRows.length) {
    $toast.error('삭제할 공정을 선택하세요.', { position: 'top-right', duration: 1000 });
    return;
  }
  if (!confirm('공정을 삭제하시겠습니까?')) return;
  const prcCode = selectedRows.map((r) => r.공정코드);
  await axios.post('http://localhost:3000/prcDelete', { diaCode: form.value.diagram, prcCode });
  prcList();
};

// 드래그 앤 드랍
const onRowDragEnd = async () => {
  const updatedData = [];
  gridApiMat.value.forEachNode((node, index) => {
    updatedData.push({ DIA_CODE: form.value.diagram, PRC_CODE: node.data.공정코드, PRC_ORDER: index + 1 });
  });
  await axios.post('http://localhost:3000/updateProcessOrder', updatedData);
  prcList();
};

// 모달 조회
const modalList = async () => {
  const res = await axios.get('http://localhost:3000/diaModalList');
  materialRowData.value = res.data.map((prd) => ({
    공정코드: prd.PRC_CODE,
    공정명: prd.PRC_NAME,
    설비유형: prd.FAC_TYPE,
    등록일자: prd.PRC_RDATE.substring(0, 10)
  }));
};

// 모달 열기
const openModal = (title, rowData, colDefs) => {
  if (!form.value.product) {
    $toast.error('제품이 선택되지 않았습니다', { position: 'top-right', duration: 1000 });
    return;
  }
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  modalRef.value?.open();
};

// 모달 확인 후 공정 추가
const modalConfirm = async (selectedRow) => {
  if (prcData.value.find((p) => p.공정코드 === selectedRow.공정코드)) {
    $toast.info('등록된 공정입니다.', { position: 'top-right', duration: 1000 });
    return;
  }
  await axios.post('http://localhost:3000/prcModalConfirm', {
    DIA_CODE: form.value.diagram,
    PRC_CODE: selectedRow.공정코드,
    PRC_NAME: selectedRow.공정명,
    FAC_TYPE: selectedRow.설비유형
  });
  prcList();
};

// 셀 변경
const onCellValueChanged = (event) => console.log(event.value);

// 검색
const searchKeyword = ref('');
const searchData = async () => {
  const res = await axios.post('http://localhost:3000/diaPrdSearch', { PRD_NAME: searchKeyword.value });
  rowData1.value = res.data.map((prd) => ({
    제품명: prd.PRD_NAME,
    제품코드: prd.PRD_CODE,
    제품유형: prd.PRD_TYPE,
    공정흐름도: prd.DIA_CODE,
    작성자: prd.PRD_WRITER,
    등록일: prd.PRD_DATE.substring(0, 10)
  }));
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
</style>
