<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <UiParentCard title="거래처등록 및 조회">
    <div class="main-container">
      <div class="list-container">
        <h5>거래처등록</h5>
        <ag-grid-vue
          :rowData="rowData1"
          :columnDefs="colDefs1"
          class="ag-theme-quartz"
          style="height: 90px; width: 100%"
          @cell-value-changed="onCellValueChanged"
        />
        <br /><br />

        <v-row justify="end">
          <v-btn color="primary" class="mr-6" @click="submitForm">등록</v-btn>
        </v-row>

        <h5>거래처목록</h5>
        <ag-grid-vue
        class="ag-theme-quartz"
        :rowData="rowData2"
        :columnDefs="colDefs2"
        :gridOptions="gridOptions"
        style="height: 360px; width: 100%"
        @grid-ready="onGridReady"
        @cell-value-changed="onCellValueChanged"
        @rowClicked="onRowClicked"
/>
        <br /><br />
        <v-row justify="end">
          <v-btn color="error" class="mr-6" @click="deleteSelected">삭제</v-btn>
        </v-row>
      </div>

      <MoDal
        ref="modalRef"
        :title="modalTitle"
        :rowData="modalRowData"
        :colDefs="modalColDefs"
        @confirm="modalConfirm"
      />
      <div class="d-flex align-right mb-4"></div>
    </div>
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef, onMounted, onBeforeUnmount, onActivated, onDeactivated } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useProcessSimStore } from '@/stores/useProcessSimStore';
import { startSimTicker, stopSimTicker } from '@/sim/simTicker.js';
import axios from 'axios';
import MoDal from '../common/NewModal.vue';
// import { useToast } from "vue-toastification";

// const toast = useToast(); 
const quartz = themeQuartz;
const store = useProcessSimStore();

// // ---- sim ticker (그대로 유지) ----
// function tryStartSimTicker() {
//   if (typeof store.tick !== 'function') {
//     console.warn('[sim] store.tick() 없음 → ticker 미시작');
//     return;
//   }
//   if (typeof window !== 'undefined' && typeof requestAnimationFrame === 'function') {
//     startSimTicker();
//   }
// }
// onMounted(tryStartSimTicker);
// onActivated(tryStartSimTicker);
// onBeforeUnmount(() => stopSimTicker());
// onDeactivated(() => stopSimTicker());

// ---- ag-Grid API 저장 ----
const gridApi = ref(null);

function onGridReady(params) {
  gridApi.value = params.api;
}


// ---- 페이지 헤더 ----
const page = ref({ title: '거래처등록 및 조회' });
const breadcrumbs = shallowRef([
  { title: '거래처', disabled: true, href: '#' },
  { title: '거래처등록 및 조회', disabled: false, href: '#' }
]);

// ================= 등록 그리드 =================
const rowData1 = ref([
  { 거래처유형: null, 거래처명: null, 담당자: null, 사용여부: null, 비고: null }
]);

const selectedRowIndex = ref(null);
const materialColDefs = [{ field: '거래처유형', headerName: '거래처유형', flex: 1 }];
const materialRowData = ref([
  { 거래처유형: '고객사' }, { 거래처유형: '공급사' }, { 거래처유형: '외주업체' },
  { 거래처유형: '운송업체' }, { 거래처유형: '폐기업체' }
]);

const colDefs1 = ref([
  {
    field: '거래처유형', flex: 1, cellClass: 'clickable-cell', headerClass: 'with-mag', editable: false,
    onCellClicked: (params) => {
      selectedRowIndex.value = params.node.rowIndex;
      openModal('거래처유형', materialRowData.value, materialColDefs);
    }
  },
  { field: '거래처명', flex: 1, editable: true },
  { field: '담당자', flex: 1, editable: true },
  { field: '사용여부', flex: 1, editable: true },
  { field: '비고', flex: 1, editable: true }
]);

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
  rowData1.value = rowData1.value.map((row, i) =>
    i === idx ? { ...row, 거래처유형: selectedRow.거래처유형 } : row
  );
  modalRef.value?.close?.();
}

const onCellValueChanged = (event) => {
  // 필요시 검증/포맷
  // console.log(event.value);
};

// 등록 버튼
const submitForm = async () => {
  if (!rowData1.value[0].거래처유형 || !rowData1.value[0].거래처명 || !rowData1.value[0].담당자 || !rowData1.value[0].사용여부) {
    alert('비어있는 항목이 존재합니다.'); return;
  }
  if (!(rowData1.value[0].사용여부 === '여' || rowData1.value[0].사용여부 === '부')) {
    alert('여/부 확인'); return;
  }
  if (!confirm('등록하시겠습니까?')) return;

  const addAcc = {
    cusType: rowData1.value[0].거래처유형,
    cusName: rowData1.value[0].거래처명,
    cusManager: rowData1.value[0].담당자,
    cusUse: rowData1.value[0].사용여부 === '여' ? 1 : 0,
    cusNote: rowData1.value[0].비고
  };

  try {
    const { data } = await axios.post('/api/marketing/insertacc', addAcc);
    if (data.affectedRows > 0) {
      await loadPartners();
      alert('성공적으로 등록되었습니다.');
      Object.keys(rowData1.value[0]).forEach((k) => (rowData1.value[0][k] = ''));
    } else {
      alert('데이터 등록 실패');
    }
  } catch (e) {
    console.error(e);
    alert('오류가 발생하였습니다.');
  }
};

// ================= 목록 그리드 =================
const rowData2 = ref([]);

const colDefs2 = ref([
  // { checkboxSelection: true, width: 50 },   
  { headerName: '거래처코드', field: 'cusId', flex: 1 },
  { headerName: '거래처유형', field: 'cusType', flex: 1 },
  { headerName: '거래처명', field: 'cusName', flex: 1 },
  { headerName: '담당자', field: 'cusManager', flex: 1 },
  {
    headerName: '사용여부', field: 'cusUse', flex: 1,
    valueFormatter: (p) =>
      (p.value === 'Y' || p.value === 1 || p.value === '1' ? '사용' : '미사용')
  },
  { headerName: '비고', field: 'cusNote', flex: 1 }
]);



//-----------------------삭제도전222222-------------
const gridOptions = {
  rowSelection: {
    mode: 'multiRow',        // 다중 선택
    headerCheckbox: true,    // 헤더 체크박스 켜기 (신규 옵션)
  },
  rowMultiSelectWithClick: true,
  suppressRowClickSelection: false,
};

function onRowClicked(event) {
  console.log('row clicked:', event.data);
}
const deleteSelected = async () => {
  if (!gridApi.value) {
    alert('그리드가 아직 준비되지 않았습니다.');
    return;
  }

  const selectedRows = gridApi.value.getSelectedRows();
  if (!selectedRows.length) {
    alert('삭제할 항목을 선택하세요.');
    return;
  }

  try {
    const ids = selectedRows.map(r => r.cusId);  // ✅ 실제 PK 필드명 확인!
    console.log('삭제 대상:', ids);
    const { data } = await axios.post('http://localhost:3000/deleteacc/bulk', { ids });
    if (data?.ok) {
      await loadPartners();
      alert('성공적으로 삭제되었습니다.');
    } else {
      alert('데이터 삭제 실패');
    }
  } catch (e) {
    console.error(e);
    alert('오류가 발생하였습니다.');
  }
};



// 데이터 로딩
async function loadPartners(params = {}) {
  const { q = null } = params;
  const { data } = await axios.get('/api/marketing/getacclist', {
    params: { q, _ts: Date.now() }
  });
  rowData2.value = Array.isArray(data) ? data : [];
}
onMounted(() => loadPartners());
</script>

<style scoped>
.main-container { display: flex; gap: 20px; padding: 0 10px; }
.list-container { flex: 1 1 50%; min-width: 400px; }
.clickable-cell { cursor: pointer; text-decoration: underline; }

/* 거래처유형 헤더 왼쪽에 돋보기 아이콘 */
:deep(.ag-header .with-mag .ag-header-cell-text)::before {
  content: '';
  display: inline-block;
  width: 16px; height: 16px; margin-right: 6px;
  background: url('/icons/magnify.svg') no-repeat center / contain;
  transform: translateY(2px);
}
</style>
