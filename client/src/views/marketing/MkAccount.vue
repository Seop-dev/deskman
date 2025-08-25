// MkAccount.vue
<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <UiParentCard title="거래처등록 및 조회">
    <div class="main-container">
      <div class="list-container">
        <!-- ================== 거래처 등록 ================== -->
        <h5>거래처등록</h5>
        <ag-grid-vue :rowData="rowData1" :columnDefs="colDefs1" class="ag-theme-quartz" style="height: 90px; width: 100%" />
        <br /><br />

        <v-row justify="end">
          <v-btn color="primary" class="mr-6" @click="submitForm">등록</v-btn>
        </v-row>

        <!-- ================== 거래처 목록 ================== -->
        <h5>거래처목록</h5>
        <ag-grid-vue
          class="ag-theme-quartz"
          :rowData="rowData2"
          :columnDefs="colDefs2"
          :gridOptions="gridOptions"
          style="height: 360px; width: 100%"
          @grid-ready="onGridReady"
          @rowClicked="onRowClicked"
        />
        <br /><br />

        <v-row justify="end">
          <v-btn color="error" class="mr-6" @click="deleteSelected">삭제</v-btn>
        </v-row>
      </div>

      <!-- ================== 모달 ================== -->
      <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
    </div>
  </UiParentCard>

  <v-snackbar v-model="snack.open" :color="snack.color" :timeout="2000">{{ snack.msg }}</v-snackbar>
</template>

<script setup>
import { ref, shallowRef, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { AgGridVue } from 'ag-grid-vue3';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axios from 'axios';
import MoDal from '../common/NewModal.vue';

// ======================================================
// ✅ 페이지 기본 설정
// ======================================================
const page = ref({ title: '거래처등록 및 조회' });
const breadcrumbs = shallowRef([
  { title: '거래처', disabled: true, href: '#' },
  { title: '거래처등록 및 조회', disabled: false, href: '#' }
]);

const snack = ref({ open: false, msg: '', color: 'primary' });
const toast = (msg, color = 'primary') => (snack.value = { open: true, msg, color });

// ======================================================
// ✅ 공통 - agGrid 옵션 & API
// ======================================================
const gridOptions = {
  rowSelection: 'multiple',
  suppressRowClickSelection: true
};
const gridApi = ref(null);

function onGridReady(params) {
  gridApi.value = params.api;
}
function onRowClicked(event) {
  console.log('행 선택됨:', event.data);
}

// ======================================================
// ✅ 거래처 등록 그리드
// ======================================================
const rowData1 = ref([{ 거래처유형: null, 거래처명: null, 담당자: null, 사용여부: null, 비고: null }]);

// 거래처유형 선택 모달 관련
const selectedRowIndex = ref(null);
const materialColDefs = [{ field: '거래처유형', headerName: '거래처유형', flex: 1 }];
const materialRowData = ref([
  { 거래처유형: '고객사' },
  { 거래처유형: '공급사' },
  { 거래처유형: '외주업체' },
  { 거래처유형: '운송업체' },
  { 거래처유형: '폐기업체' }
]);

// 등록 그리드 컬럼 정의
const colDefs1 = ref([
  {
    field: '거래처유형',
    headerName: '거래처유형',
    flex: 1,
    cellClass: 'clickable-cell',
    editable: false,
    onCellClicked: (params) => {
      selectedRowIndex.value = params.node.rowIndex;
      openModal('거래처유형', materialRowData.value, materialColDefs);
    }
  },
  { field: '거래처명', flex: 1, editable: true },
  { field: '담당자', flex: 1, editable: true },
  {
    field: '사용여부',
    headerName: '사용여부',
    flex: 1,
    editable: true,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: ['사용', '미사용'] }
  },
  { field: '비고', flex: 1, editable: true }
]);

// ======================================================
// ✅ 모달 제어
// ======================================================
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);

function openModal(title, rowData, colDefs) {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  modalRef.value?.open?.();
}
function modalConfirm(selectedRow) {
  if (selectedRowIndex.value == null) return;
  const idx = selectedRowIndex.value;
  rowData1.value = rowData1.value.map((row, i) => (i === idx ? { ...row, 거래처유형: selectedRow.거래처유형 } : row));
  modalRef.value?.close?.();
}

// ======================================================
// ✅ 등록 처리
// ======================================================
const submitForm = async () => {
  const row = rowData1.value[0];
  if (!row.거래처유형 || !row.거래처명 || !row.담당자 || !row.사용여부) {
    return toast('비어있는 항목이 존재합니다.', 'warning');
  }
  if (!(row.사용여부 === '사용' || row.사용여부 === '미사용')) {
    return toast('사용/미사용 확인', 'warning');
  }
  if (!confirm('등록하시겠습니까?')) return;

  const addAcc = {
    cusType: row.거래처유형,
    cusName: row.거래처명,
    cusManager: row.담당자,
    cusUse: row.사용여부 === '사용' ? 1 : 0,
    cusNote: row.비고
  };
  console.log(addAcc);
  try {
    const { data } = await axios.post('/marketing/insertacc', addAcc);
    if (data.affectedRows > 0) {
      await loadPartners();
      toast('성공적으로 등록되었습니다.', 'success');
      Object.keys(row).forEach((k) => (row[k] = ''));
    } else {
      toast('데이터 등록 실패', 'error');
    }
  } catch (e) {
    console.error(e);
    toast('오류가 발생하였습니다.', 'error');
  }
};

// ======================================================
// ✅ 목록 그리드
// ======================================================
const rowData2 = ref([]);

const colDefs2 = ref([
  { headerName: '', checkboxSelection: true, headerCheckboxSelection: true, width: 50 },
  { headerName: '거래처코드', field: 'cusId', flex: 1 },
  { headerName: '거래처유형', field: 'cusType', flex: 1 },
  { headerName: '거래처명', field: 'cusName', flex: 1 },
  { headerName: '담당자', field: 'cusManager', flex: 1 },
  {
    headerName: '사용여부',
    field: 'cusUse',
    flex: 1,
    valueFormatter: (p) => (p.value === 'Y' || p.value === 1 || p.value === '1' ? '사용' : '미사용')
  },
  { headerName: '비고', field: 'cusNote', flex: 1 }
]);

// ======================================================
// ✅ 목록 로딩
// ======================================================
onMounted(() => loadPartners());
async function loadPartners() {
  const res = await axios.get('/marketing/getacclist');
  console.log('서버 응답:', res.data);
  rowData2.value = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

// ======================================================
// ✅ 삭제 처리
// ======================================================
const deleteSelected = async () => {
  if (!gridApi.value) return toast('그리드가 준비되지 않았습니다.', 'warning');

  const selectedRows = gridApi.value.getSelectedRows();
  if (!selectedRows.length) return toast('삭제할 항목을 선택하세요.', 'warning');

  try {
    const ids = selectedRows.map((r) => r.cusId);
    const { data } = await axios.delete('/deleteAccount', {
      data: { ids }
    });
    // console.log('삭제할 ids:', ids);

    console.log(data);
    if (data.affectedRows > 0) {
      await loadPartners();
      toast('성공적으로 삭제되었습니다.', 'success');
    } else {
      toast('데이터 삭제 실패', 'error');
    }
  } catch (e) {
    console.error(e);
    toast('오류가 발생하였습니다.', 'error');
  }
};
</script>

<style scoped>
.clickable-cell {
  cursor: pointer;
  text-decoration: underline;
}
</style>
