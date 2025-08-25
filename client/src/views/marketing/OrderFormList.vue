<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="주문서 조회">
    <div class="main-container">
      <div class="list-container">
        <ag-grid-vue
          :rowData="rowData1"
          :columnDefs="colDefs1"
          :theme="quartz"
          style="height: 500px; width: 100%"
          @cell-value-changed="onCellValueChanged"
          @grid-ready="onGridReadyMat"
          :rowSelection="'multiple'"
          :pagination="true"
          :pagination-page-size="20"
        >
          >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
        <br /><br />
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
// 모달 임포트
import axios from 'axios';
// import MoDal from '../common/NewModal.vue'; // 수정된 부분: 모달 컴포넌트 임포트
const quartz = themeQuartz;

onMounted(() => {
  reqSelect();
});
// 제품 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  { headerCheckboxSelection: true, checkboxSelection: true, width: 50 },
  { field: '주문일자', flex: 1 },
  { field: '주문번호', flex: 1 },
  { field: '업체명', flex: 1 },
  { field: '제품코드', flex: 1 },
  { field: '제품명', flex: 1 },
  { field: '주문수량', flex: 1 },
  { field: '미납수량', flex: 1 },
  { field: '납기일자', flex: 1 },
  { field: '출하일자', flex: 1 },
  { field: '주문상태', flex: 1 }
]);
const gridApiMat = ref(null); // mat 그리드 API 저장용

const onGridReadyMat = (params) => {
  gridApiMat.value = params.api;
};
const page = ref({ title: '주문서조회' });
const breadcrumbs = shallowRef([
  {
    title: '영업',
    disabled: true,
    href: '#'
  },
  {
    title: '주문서',
    disabled: true,
    href: '#'
  },
  {
    title: '주문서조회',
    disabled: false,
    href: '#'
  }
]);

const reqSelect = async () => {
  const res = await axios.get('/reqSelect');
  rowData1.value = res.data.map((r) => ({
    주문일자: r.REQ_DATE,
    주문번호: r.REQ_ID,
    업체명: r.CUS_NAME,
    제품코드: r.PRD_CODE,
    제품명: r.PRD_NAME,
    주문수량: r.REQ_QTY,
    미납수량: r.YET_QTY,
    납기일자: r.REQ_DDAY ? r.REQ_DDAY.substring(0, 10) : null,
    출하일자: r.LAST_SHIP_DATE ? r.LAST_SHIP_DATE.substring(0, 10) : null,
    주문상태: r.YET_QTY === 0 ? '완료' : r.REQ_STATUS // ✅ 미납수량이 0이면 "완료"
  }));
  console.log(res);
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
  min-width: 500px;
}
</style>
