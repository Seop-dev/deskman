<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

  <UiParentCard>
    <!-- 버튼 -->
    <v-row class="mb-4" justify="space-between" align="center">
      <v-col cols="auto">
        <!-- <v-btn color="warning" class="mr-2 button" @click="openModal('제품유형', prdRowData, prdColDefs)">제품조회 </v-btn> -->
        <!-- <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="onModalConfirm" /> -->
      </v-col>
    </v-row>
    <v-row class="mb-4">
      <v-col cols="3">
        <v-text-field label="검사번호" v-model="form.certId" dense outlined />
      </v-col>
      <v-col cols="3">
        <v-text-field label="제품명" v-model="form.prdName" dense outlined />
      </v-col>
      <v-col cols="3">
        <v-text-field label="제품유형" v-model="form.prdType" dense outlined />
      </v-col>
      <v-col cols="3">
        <v-text-field label="검사완료일자" v-model="form.chkedDate" type="date" dense outlined />
      </v-col>
      <v-row justify="end">
        <v-btn color="error" class="top_btn_ser" variant="elevated" @click="resetForm">초기화</v-btn>
      </v-row>
    </v-row>
    <br />
    <ag-grid-vue
      :rowData="gridData"
      :columnDefs="colDefs"
      :theme="quartz"
      :gridOptions="myGridOptions"
      @row-clicked="onRowClicked"
      style="height: 400px"
    />
  </UiParentCard>
</template>

<script setup>
import axios from 'axios';
import { useRouter } from 'vue-router';
import { ref, shallowRef, computed, onBeforeMount } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import MoDal from '@/views/common/NewModal.vue';

ModuleRegistry.registerModules([AllCommunityModule]);

const quartz = themeQuartz;
const router = useRouter();

const page = ref({ title: '제품검사성적서 조회' });
const breadcrumbs = shallowRef([
  {
    title: '품질',
    disabled: true,
    href: '#'
  },
  {
    title: '제품성적서조회',
    disabled: false,
    href: '#'
  }
]);

const form = ref({
  prdType: '',
  chkedDate: '',
  certId: '',
  prdName: ''
});

// 모달 구성
// const modalRef = ref(null);
// const modalTitle = ref('');
// const modalRowData = ref([]);
// const modalColDefs = ref([]);

// const openModal = (title, rowData, colDefs) => {
//   modalTitle.value = title;
//   modalRowData.value = rowData;
//   modalColDefs.value = colDefs;
//   if (modalRef.value) {
//     modalRef.value.open();
//   }
// };

// function onModalConfirm(selectedRow) {
//   form.value.certId = selectedRow.검사번호;
//   form.value.prdName = selectedRow.제품명;
//   form.value.prdType = selectedRow.제품유형;
//   form.value.chkedDate = selectedRow.검사완료일자;

//   // 그리드 데이터에 추가
//   rowData.value.push({
//     certId: selectedRow.검사번호,
//     prdName: selectedRow.제품명,
//     prdType: selectedRow.제품유형,
//     finishedAt: selectedRow.검사완료일자
//   });
// }

const colDefs = ref([
  { headerName: '검사번호', field: 'certId' },
  { headerName: '제품명', field: 'prdName' },
  { headerName: '제품유형', field: 'prdType' },
  { headerName: '제품코드', field: 'prdCode' },
  { headerName: '검사완료일자', field: 'finishedAt' }
]);

const rowData = ref([]);

// // 목록 그리드 구성
// const prdColDefs = [
//   { field: '검사번호', headerName: '검사번호', flex: 1.2 },
//   { field: '제품코드', headerName: '제품코드', flex: 1 },
//   { field: '제품명', headerName: '제품명', flex: 0.8 },
//   { field: '검사완료일자', headerName: '검사완료일자', flex: 0.8 },
//   { field: '제품유형', headerName: '제품유형', flex: 0.6 }
// ];
// const prdRowData = ref([]);

// db연결
const getPrdList = async () => {
  try {
    const result = await axios.get('/prdcertlist');

    // DB 응답 데이터를 rowData에 매핑
    if (result.data.length > 0) {
      // DB 필드명을 Vue 컴포넌트에서 사용하는 필드명으로 매핑
      rowData.value = result.data.map((item) => ({
        certId: item.PRD_CERT_ID, // 검사번호
        prdCode: item.PRD_CODE, // 제품코드
        prdName: item.PRD_NAME, // 제품명
        finishedAt: (item.Q_CHECKED_DATE || '').substring(0, 10), // 검사완료일자
        prdType: item.PRD_TYPE, // 제품유형
        totalQty: item.TOTAL_QTY, // 총수량
        writer: item.CREATED_BY // 작성자
      }));
    }
  } catch (err) {
    console.error('데이터 로딩 실패:', err.message);
  }
};

onBeforeMount(() => {
  getPrdList();
});

// 검색활성화
const gridData = computed(() => {
  const date = (form.value.chkedDate || '').trim(); // 날짜는 소문자 불필요
  const cid = (form.value.certId || '').trim().toLowerCase();
  const prdn = (form.value.prdName || '').trim().toLowerCase();
  const prdt = (form.value.prdType || '').trim().toLowerCase();

  const toL = (v) => (v ?? '').toString().toLowerCase().trim();

  return rowData.value.filter((r) => {
    const byChkDate = !date || (r.finishedAt ?? '').includes(date);
    const byCid = !cid || toL(r.certId).includes(cid); // 부분일치
    const byPrdn = !prdn || toL(r.prdName).includes(prdn); //  제품명 포함 검색
    const byPrdt = !prdt || toL(r.prdType).includes(prdt); //  유형 포함(또는 ===)
    return byChkDate && byCid && byPrdn && byPrdt;
  });
});

const myGridOptions = ref({
  defaultColDef: { flex: 1, minWidth: 100, resizable: true },
  columnDefs: colDefs,
  pagination: true,
  paginationAutoPageSize: true
});

// 행 클릭 이벤트 핸들러
const onRowClicked = (event) => {
  const rowData = event.data;
  console.log('클릭된 행:', rowData);

  // /qm/prdlstdtl 경로로 이동하면서 데이터 전달
  router.push({
    path: '/qm/prdlstdtl',
    query: {
      certId: rowData.certId, // 검사번호
      prdCode: rowData.prdCode, // 제품코드
      prdName: rowData.prdName, // 제품명
      finishedAt: rowData.finishedAt, // 검사완료일자
      prdType: rowData.prdType, // 제품유형
      totalQty: rowData.totalQty, // 총수량
      writer: rowData.writer // 작성자
    }
  });
};

// 초기화 버튼
const resetForm = () => {
  const r = form.value;
  r.chkedDate = '';
  r.certId = '';
  r.prdName = '';
  r.prdType = '';
};
</script>
