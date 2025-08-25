<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <UiParentCard title="재공품 목록">
    <div class="d-flex align-center mb-4">
      <v-text-field label="재공품 검색" v-model="searchKeyword" hide-details class="mr-2" style="max-width: 280px"></v-text-field>
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
              <v-text-field label="재공품코드" v-model="form.wipCode" readonly dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="재공품명" v-model="form.wipName" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="작성자" v-model="form.writer" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-text-field label="등록일자" v-model="form.date" type="date" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-select label="단위" v-model="form.unit" :items="unitOptions" dense outlined />
            </v-col>
            <v-col cols="6">
              <v-select label="재공품유형" v-model="form.type" :items="typeOptions" dense outlined />
            </v-col>
            <v-col cols="12">
              <v-text-field label="규격" v-model="form.size" placeholder="규격" dense outlined readonly>
                <template #append-inner>
                  <i
                    class="fa-solid fa-magnifying-glass"
                    style="cursor: pointer; font-size: large; margin-right: 0.5rem"
                    @click="openModal('재공품 규격 조회', materialRowData, materialColDefs)"
                  ></i>
                </template>
              </v-text-field>
              <MoDal ref="modalRef" :title="modalTitle" :rowData="modalRowData" :colDefs="modalColDefs" @confirm="modalConfirm" />
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

const today = new Date().toISOString().split('T')[0];

const form = ref({
  wipCode: '',
  wipName: '',
  writer: authStore.user?.name || '',
  date: today,
  size: '',
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
  { field: '재공품코드', editable: true, width: 130 },
  { field: '재공품명', width: 130, editable: true },
  { field: '재공품유형', width: 130, editable: true },
  { field: '규격', width: 110, editable: true },
  { field: '단위', width: 110, editable: true },
  { field: '작성자', width: 110, editable: true },
  { field: '등록일자', width: 110, editable: true }
]);

const page = ref({ title: '재공품 관리' });
const breadcrumbs = shallowRef([
  { title: '기준정보', disabled: true, href: '#' },
  { title: '재공품 관리', disabled: false, href: '#' }
]);

// 단위, 유형 드롭박스
const unitOptions = ref([]);
const typeOptions = ref([]);
const unitList = async () => {
  const res = await axios.get('/masterWIPUnit');
  unitOptions.value = res.data.map((prd) => prd.code_name);
};
const typeList = async () => {
  const res = await axios.get('/masterWIPType');
  typeOptions.value = res.data.map((prd) => prd.code_name);
};

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
// 모달 조회
const modalList = async () => {
  const res = await axios.get('/masterWIPModal');
  materialRowData.value = res.data.map((prd) => ({
    그룹코드: prd.group_code,
    규격: prd.code_name,
    사용유무: prd.use_yn
  }));
};
// 모달에서 확인시
const modalConfirm = async (selectedRow) => {
  form.value.size = selectedRow.규격;
  $toast.info(`규격 [${selectedRow.규격}] 선택됨`, { position: 'top-right' });
};

// 그리드 API
const gridApiMat = ref(null);
const onGridReadyMat = (params) => {
  gridApiMat.value = params.api;
};

onMounted(() => {
  wipList();
  unitList();
  typeList();
  modalList();
});

const wipList = async () => {
  const res = await axios.get('/masterWIPSelect');
  rowData1.value = res.data.map((prd) => ({
    재공품코드: prd.WIP_CODE,
    재공품명: prd.WIP_NAME,
    재공품유형: prd.WIP_TYPE,
    규격: prd.WIP_SIZE,
    단위: prd.WIP_UNIT,
    작성자: prd.WIP_WRITER,
    등록일자: prd.WIP_DATE.substring(0, 10),
    비고: prd.WIP_NOTE
  }));
};

// 저장
const submitForm = async () => {
  if (!form.value.type || !form.value.wipName || !form.value.size) {
    $toast.warning('값을 올바르게 기재하십시오.', { position: 'top-right', duration: 1000 });
    return;
  }

  if (form.value.wipCode) {
    const updateRow = {
      WIP_NAME: form.value.wipName,
      WIP_TYPE: form.value.type,
      WIP_UNIT: form.value.unit,
      WIP_SIZE: form.value.size,
      WIP_DATE: form.value.date,
      WIP_NOTE: form.value.note,
      WIP_WRITER: form.value.writer,
      WIP_CODE: form.value.wipCode
    };
    await axios.post('/masterWIPUpdate', updateRow);
    $toast.success('재공품이 수정되었습니다.', { position: 'top-right', duration: 1000 });
  } else {
    const newRow = {
      WIP_NAME: form.value.wipName,
      WIP_TYPE: form.value.type,
      WIP_UNIT: form.value.unit,
      WIP_SIZE: form.value.size,
      WIP_DATE: form.value.date,
      WIP_NOTE: form.value.note,
      WIP_WRITER: form.value.writer
    };
    await axios.post('/masterWIPInsert', newRow);
    $toast.success('재공품이 등록되었습니다.', { position: 'top-right', duration: 1000 });
  }

  await wipList();
};

// 삭제
const del = async () => {
  const selectedRows = gridApiMat.value.getSelectedRows();
  if (selectedRows.length === 0) {
    $toast.warning('삭제할 재공품을 선택하세요.', { position: 'top-right', duration: 1000 });
    return;
  }
  if (!confirm(`${selectedRows.map((r) => r.재공품명).join(', ')}을 삭제하시겠습니까?`)) return;

  const wipCode = selectedRows.map((r) => r.재공품코드);
  console.log(wipCode);
  await axios.post('/masterWIPDelete', { WIP_CODE: wipCode });
  await wipList();
  $toast.success(`${selectedRows.map((r) => r.재공품명)}(이)가 삭제되었습니다.`, { position: 'top-right', duration: 1000 });
};

// 초기화
const resetForm = () => {
  form.value = {
    wipCode: '',
    wipName: '',
    writer: authStore.user?.name || '',
    date: today,
    size: '',
    type: '',
    note: ''
  };
  wipList();
  // writer와 date는 유지
};

// 행선택시 등록 폼
const onRowClicked = (event) => {
  form.value.wipCode = event.data.재공품코드;
  form.value.wipName = event.data.재공품명;
  form.value.writer = event.data.작성자;
  form.value.date = event.data.등록일자;
  form.value.size = event.data.규격;
  form.value.unit = event.data.단위;
  form.value.type = event.data.재공품유형;
  form.value.note = event.data.비고;
};

// 모달 열기
const openModal = async (title, rowData, colDefs) => {
  modalTitle.value = title;
  modalRowData.value = rowData;
  modalColDefs.value = colDefs;
  modalRef.value?.open();
};

// 검색
const searchKeyword = ref('');
const searchData = async () => {
  if (!searchKeyword.value) {
    $toast.warning('재공품이 입력되지 않았습니다', { position: 'top-right', duration: 1000 });
    return;
  }
  const condition = { WIP_NAME: searchKeyword.value };
  const res = await axios.post('/masterWIPSearch', condition);
  rowData1.value = res.data.map((prd) => ({
    재공품코드: prd.WIP_CODE,
    재공품명: prd.WIP_NAME,
    재공품유형: prd.WIP_TYPE,
    규격: prd.WIP_SIZE,
    단위: prd.WIP_UNIT,
    작성자: prd.WIP_WRITER,
    등록일자: prd.WIP_DATE ? prd.WIP_DATE.substring(0, 10) : null,
    비고: prd.WIP_NOTE
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
