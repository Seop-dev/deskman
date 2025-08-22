<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard title="출하지시서 등록">
    <v-row class="mb-4">
      <v-col cols="6">
        <v-text-field label="주문서번호" v-model="form.order" dense outlined readonly>
          <template #append-inner>
            <i
              class="fa-solid fa-magnifying-glass"
              style="cursor: pointer; font-size: large; margin-right: 0.5rem"
              @click="openModal('주문서 조회', materialRowData, materialColDefs)"
            ></i>
          </template>
        </v-text-field>
        <MoDal
          ref="modalRef"
          :key="modalKey"
          :title="modalTitle"
          :rowData="materialRowData"
          :colDefs="materialColDefs"
          @confirm="onModalConfirm"
        />
      </v-col>
      <v-col cols="6">
        <v-text-field label="거래처" v-model="form.customer" outlined />
      </v-col>
      <v-col cols="6">
        <v-text-field label="납기일자" v-model="form.dueDate" readonly="true" type="date" dense outlined />
      </v-col>
      <v-col cols="6">
        <v-text-field label="출하지시일자" v-model="form.shipDate" type="date" :max="`${form.dueDate}`" dense outlined />
      </v-col>
      <v-col cols="6">
        <v-text-field label="작성자" v-model="form.writer" dense outlined />
      </v-col>
      <v-col cols="6">
        <v-select label="창고명" v-model="form.wrName" :items="wrOptions" dense outlined />
      </v-col>
      <v-row justify="end">
        <v-btn color="warning" class="mr-3" @click="openModal1('입고 제품 조회', materialRowData1, materialColDefs1)">입고 조회</v-btn>
        <MoDal
          ref="modalRef1"
          :key="modalKey1"
          :title="modalTitle1"
          :rowData="materialRowData1"
          :colDefs="materialColDefs1"
          @confirm="modalConfirm"
        />
      </v-row>
    </v-row>

    <ag-grid-vue
      :rowData="rowData"
      :columnDefs="colDefs"
      :theme="quartz"
      style="height: 200px; width: 100%"
      @cell-value-changed="onCellValueChanged"
      @grid-ready="onGridReadyMat"
      :rowSelection="'multiple'"
    >
    </ag-grid-vue>

    <!-- 버튼 -->
    <v-row justify="end" class="button">
      <v-btn color="error" class="mr-2" @click="resetForm">초기화</v-btn>
      <v-btn color="primary" @click="submitForm">등록</v-btn>
    </v-row>
  </UiParentCard>
</template>

<script setup>
import { ref, shallowRef, reactive, onMounted, nextTick } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { themeQuartz } from 'ag-grid-community';
import MoDal from '../common/NewModal.vue';
import axios from 'axios';

const quartz = themeQuartz;
const wrOptions = ref([]);
onMounted(() => {
  modalList();
  fetchCommonCodes();
});
const modalKey = ref(0);
const modalKey1 = ref(0);

// 공통코드 데이터를 가져오는 함수
const fetchCommonCodes = async () => {
  try {
    // 부서 공통코드 API 호출 (예시)
    const authRes = await axios.get('http://localhost:3000/wrNameSelect');
    wrOptions.value = authRes.data.map((item) => item.WR_NAME); // `code_name`을 배열에 담기
  } catch (error) {
    console.error('공통코드 데이터를 불러오는 데 실패했습니다:', error);
  }
};

// ----------------- 그리드 데이터 (독립) -----------------
const rowData = ref([]);

const colDefs = ref([
  { headerCheckboxSelection: true, checkboxSelection: true, width: 50 },
  { field: '제품코드', flex: 1 },
  { field: '제품명', flex: 1 },
  { field: '제품유형', flex: 1 },
  { field: '출하수량', editable: true, flex: 1 },
  { field: '입고일자', flex: 1 },
  { field: 'LOT번호', flex: 1 }
]);

// ----------------- 폼 입력 필드 (유지) -----------------
const form = reactive({ order: '', customer: '', dueDate: '', shipDate: '', writer: '', wrName: '', cusId: '' });

// ----------------- 모달 (기본 정의) -----------------
const modalRef = ref(null);
const modalTitle = ref('');
const modalRowData = ref([]);
const modalColDefs = ref([]);

// 주문서 모달

const materialColDefs = [
  { field: '주문서번호', headerName: '주문서번호', flex: 1 },
  { field: '주문일자', headerName: '주문일자', flex: 1 },
  { field: '거래처', headerName: '거래처', flex: 1 },
  { field: '제품명', headerName: '제품명', flex: 1 },
  { field: '주문수량', headerName: '주문수량', flex: 1 },
  { field: '납기일자', headerName: '납기일자', flex: 1 }
];
const materialRowData = ref([]);

// 모달 조회
const modalList = async () => {
  const res = await axios.get('http://localhost:3000/shipModalSelect');
  materialRowData.value = res.data.map((prd) => ({
    주문서번호: prd.REQ_ID,
    주문일자: prd.REQ_DATE,
    거래처: prd.CUS_ID,
    제품명: prd.PRD_NAME,
    주문수량: prd.REQ_QTY,
    납기일자: prd.REQ_DDAY ? prd.REQ_DDAY.substring(0, 10) : null
  }));
  console.log(res);
};

const openModal = async (title, rowData, colDefs) => {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  if (modalRef.value) {
    modalRef.value.open();
  }
};

// 입고 제품 모달
const modalRef1 = ref(null);
const modalTitle1 = ref('');

const materialRowData1 = ref([]);
const materialColDefs1 = [
  { field: 'LOT번호', headerName: 'LOT번호', flex: 1 },
  { field: '제품코드', headerName: '제품코드', flex: 1 },
  { field: '제품명', headerName: '제품명', flex: 1 },
  { field: '제품유형', headerName: '제품유형', flex: 1 },
  { field: '재고수량', headerName: '재고수량', flex: 1 },
  { field: '입고일자', headerName: '입고일자', flex: 1 }
];

// 입고 제품 조회

const openModal1 = async (title) => {
  if (!form.order) {
    alert('주문서를 선택해주세요');
    return;
  }
  console.log('hi');
  const condition = { REQ_ID: form.order };
  const res = await axios.post('http://localhost:3000/shipPrdSelect', condition);
  materialRowData1.value = res.data.map((prd) => ({
    LOT번호: prd.PRD_LOT,
    제품코드: prd.PRD_CODE,
    제품명: prd.PRD_NAME,
    제품유형: prd.PRD_TYPE,
    재고수량: prd.RECEIVED_QTY,
    입고일자: prd.RECEIVED_DATE ? prd.RECEIVED_DATE.substring(0, 10) : null
  }));
  console.log(res);

  modalTitle1.value = title;
  modalKey1.value++; // 강제 리마운트
  await nextTick(); // 데이터 반영 완료 후
  modalRef1.value?.open();
};

function onModalConfirm(selectedRow) {
  if (!selectedRow) return;

  // 단일 선택일 경우
  form.order = selectedRow.주문서번호 || '';
  form.customer = selectedRow.거래처 || '';
  form.dueDate = selectedRow.납기일자 || '';
  form.cusId = selectedRow.거래처코드;
}
function modalConfirm(selectedRow) {
  if (!Array.isArray(selectedRow)) selectedRow = [selectedRow];

  // 선택된 항목들 그리드에 추가
  selectedRow.forEach((row) => {
    rowData.value.unshift({
      제품명: row.제품명 || '',
      제품코드: row.제품코드 || '',
      제품유형: row.제품유형 || '',
      출하수량: row.재고수량 || '',
      입고일자: row.입고일자 || '',
      LOT번호: row.LOT번호
    });
  });
}

// ----------------- 리셋 / 제출 -----------------
function resetForm() {
  // 폼 필드 초기화
  form.supplier = '';
  form.orderDate = '';
  form.dueDate = '';
  form.manager = '';

  rowData.value = [];
}
const gridApiMat = ref(null); // mat 그리드 API 저장용

const onGridReadyMat = (params) => {
  gridApiMat.value = params.api;
};
async function submitForm() {
  if (!form.order) {
    alert('주문서가 조회되지 않았습니다.');
    return;
  }
  const selectedRows = gridApiMat.value.getSelectedRows();
  if (selectedRows.length === 0) {
    alert('입고할 제품을 선택하세요');
    return;
  }
  console.log(selectedRows);
  const payload = selectedRows.map((r) => ({
    REQ_ID: form.order,
    CUS_ID: form.customer,
    PRD_LOT: r.LOT번호,
    SHIP_ORDER_DATE: form.shipDate,
    SHIP_WRITER: form.writer,
    WR_NAME: form.wrName,
    PRD_CODE: r.제품코드,
    PRD_NAME: r.제품명,
    QTY: r.출하수량,
    D_DAY: form.dueDate
  }));
  // 랏번호는 노드에서 진행
  const res = await axios.post('http://localhost:3000/shipInsert', payload);
  console.log(res);
  alert('등록완료');
}

const page = ref({ title: '출하지시서 등록' });
const breadcrumbs = shallowRef([
  { title: '제품 입출고', disabled: true, href: '#' },
  { title: '출하지시서 등록', disabled: false, href: '#' }
]);
</script>

<style scoped>
.margin {
  margin-top: 2.5rem;
}

.button {
  margin-top: 1.5rem;
}
</style>
