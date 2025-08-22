<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="출하지시서 조회">
    <div class="d-flex align-center mb-4">
      <v-text-field
        label="출하 예정 일자"
        type="date"
        v-model="startDate"
        hide-details
        class="mr-2"
        style="max-width: 180px"
      ></v-text-field>
      <v-text-field label="출하 예정 일자" type="date" v-model="endDate" hide-details class="mr-2" style="max-width: 180px"></v-text-field>
      <v-btn color="darkText" @click="filterData">검색</v-btn>
      <v-btn color="error" class="ml-2" @click="reset">초기화</v-btn>

      <v-row justify="end" class="mr-3">
        <v-btn color="warning" class="mr-2" @click="openModal('운송사 조회', materialRowData1, materialColDefs1)">운송사</v-btn>
        <MoDal ref="modalRef1" :title="modalTitle" :rowData="materialRowData1" :colDefs="materialColDefs1" @confirm="onModalConfirm" />
        <v-btn color="primary" class="mr-1" @click="scrap">출하</v-btn>
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
          rowSelection="multiple"
          :rowMultiSelectWithClick="true"
          @rowClicked="onRowClicked"
          @grid-ready="onGridReady"
          :pagination="true"
          pagination-page-size="20"
        >
          <!--  :defaultColDef="{ width: 150 }" 로 전체 width지정도가능-->
        </ag-grid-vue>
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

const quartz = themeQuartz;
const startDate = ref('');
const endDate = ref('');

onMounted(() => {
  wrShip();
});

// 제품 리스트
const rowData1 = ref([]);

const colDefs1 = ref([
  {
    headerCheckboxSelection: true, // 헤더에서 전체 선택 가능
    checkboxSelection: true, // 각 행에서 선택 가능
    width: 50
  },
  { field: '출하번호', editable: true, flex: 1 },
  { field: '창고명', flex: 1 },
  { field: 'LOT번호', flex: 1 },
  { field: '제품명', flex: 1 },
  { field: '출하수량', flex: 1 },
  { field: '운송사', flex: 1, editable: true },
  { field: '차량번호', flex: 1, editable: true },
  { field: '출하담당자', flex: 1 },
  { field: '출하예정일자', flex: 1 },
  { field: '출하일자', flex: 1 },
  {
    field: '출하상태',
    flex: 1,
    editable: true,
    cellStyle: (params) => {
      if (params.value === '대기') {
        return { color: 'green', fontWeight: 'bold' };
      } else if (params.value === '출하완료') {
        return { color: 'blue', fontWeight: 'bold' };
      }
      return null;
    }
  }
]);

const page = ref({ title: '출하지시서' });
const breadcrumbs = shallowRef([
  {
    title: '물류',
    disabled: true,
    href: '#'
  },
  {
    title: '출하지시서',
    disabled: false,
    href: '#'
  }
]);

//cell 단위 수정
const onCellValueChanged = (event) => {
  console.log(event.value);
  console.log(rowData1.value);
};
const allData = ref([]);
const wrShip = async () => {
  const res = await axios.get('http://localhost:3000/wrShip');
  allData.value = res.data.map((emp) => ({
    출하번호: emp.SHIP_NO,
    창고명: emp.WR_NAME,
    주문번호: emp.REQ_ID,
    LOT번호: emp.PRD_LOT,
    제품명: emp.PRD_NAME,
    출하수량: emp.QTY,
    운송사: emp.DELIVERY,
    차량번호: emp.CAR_NO,
    출하담당자: emp.SHIP_WRITER,
    출하예정일자: emp.SHIP_ORDER_DATE ? emp.SHIP_ORDER_DATE.substring(0, 10) : null,
    출하일자: emp.SHIP_DATE ? emp.SHIP_DATE.substring(0, 10) : null,
    출하상태: emp.SHIP_STATUS
  }));
  rowData1.value = allData.value;
};
const modalRowData1 = ref([]);
const modalColDefs1 = ref([]);

// 그리드 api
const gridApi = ref(null);
const onGridReady = (params) => {
  gridApi.value = params.api; // API 저장
  console.log(gridApi.value);
};
const scrap = async () => {
  const selectedRows = gridApi.value.getSelectedRows();
  if (selectedRows.length === 0) {
    alert('출하할 제품을 선택하세요');
    return;
  }
  const payload = selectedRows.map((r) => ({
    DELIVERY: r.운송사,
    CAR_NO: r.차량번호,
    SHIP_NO: r.출하번호
  }));
  const res = await axios.post('http://localhost:3000/wrShipUpdate', payload);
  console.log(res);
  alert('출하 처리가 완료되었습니다.');
  //화면 반영
  wrShip();
};
// 입고 제품 모달
const modalRef1 = ref(null);
const modalTitle1 = ref('');

const materialRowData1 = ref([]);
const materialColDefs1 = [
  { field: '거래처유형', headerName: '거래처유형', flex: 1 },
  { field: '거래처명', headerName: '거래처명', flex: 1 },
  { field: '거래담당자', headerName: '거래담당자', flex: 1 }
];

const openModal = async (title) => {
  const selectedRows = gridApi.value.getSelectedRows();
  if (selectedRows.length === 0) {
    alert('행을 선택해주세요');
    return;
  }
  const res = await axios.get('http://localhost:3000/wrDelivery');
  materialRowData1.value = res.data.map((r) => ({
    거래처유형: r.CUS_TYPE,
    거래처명: r.CUS_NAME,
    거래담당자: r.CUS_MANAGER
  }));
  console.log(res);

  modalTitle1.value = title;
  modalRowData1.value = rowData1;
  modalColDefs1.value = colDefs1;
  if (modalRef1.value) {
    modalRef1.value.open();
  }
};

const onModalConfirm = async (selectedRow) => {
  const selectedRows = gridApi.value.getSelectedRows();
  console.log(selectedRow.거래처명);
  console.log(selectedRows[0].운송사);
  for (const row of selectedRows) {
    row.운송사 = selectedRow.거래처명;
  }
  // 그리드api에 적용
  gridApi.value.applyTransaction({ update: selectedRows });
};

const filterData = () => {
  const start = startDate.value ? new Date(startDate.value) : null;
  const end = endDate.value ? new Date(endDate.value) : null;

  rowData1.value = allData.value.filter((item) => {
    const orderDate = new Date(item.출하예정일자);

    // startDate, endDate 둘 다 있으면 사이 값
    if (start && end) {
      return orderDate >= start && orderDate <= end;
    }

    // startDate만 있으면 그 이후 값
    if (start && !end) {
      return orderDate >= start;
    }

    // endDate만 있으면 그 이전 값
    if (!start && end) {
      return orderDate <= end;
    }

    // 아무것도 없으면 전체
    return true;
  });
};
const reset = async () => {
  startDate.value = '';
  endDate.value = '';
  await wrShip();
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
