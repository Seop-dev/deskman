<template>
  <v-dialog v-model="dialog" max-width="800" scrollable="true">
    <v-card>
      <v-card-title class="headline">{{ title }}</v-card-title>
      <v-card-actions class="justify-end">
        <v-btn color="darkText" variant="flat" class="mr-1" @click="addRow">추가</v-btn>
        <v-btn color="primary" variant="flat" class="mr-1" @click="update">저장</v-btn>
        <v-btn color="error" variant="flat" class="mr-4" @click="del">삭제</v-btn>
      </v-card-actions>
      <v-card-text>
        <ag-grid-vue
          :rowData="internalRowData"
          :columnDefs="internalColDefs"
          :theme="quartz"
          rowSelection="single"
          @rowClicked="onRowClicked"
          style="height: 400px; width: 100%"
          :pagination="true"
          :pagination-page-size="10"
          @grid-ready="onGridReady"
        ></ag-grid-vue>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="confirm">확인</v-btn>
        <v-btn color="error" text @click="close">취소</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, defineExpose, defineProps } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { themeQuartz } from 'ag-grid-community';
import axios from 'axios';

import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-bootstrap.css';
const $toast = useToast();

const quartz = themeQuartz;
const dialog = ref(false);

const props = defineProps({
  title: String,
  rowData: Array,
  colDefs: Array
});

// 그리드 api에 값 저장
let gridApi = null;

const onGridReady = (params) => {
  gridApi = params.api;
};

// 창고 삭제
const del = async () => {
  const selectedRows = gridApi.getSelectedRows();
  console.log(selectedRows);
  if (selectedRows.length === 0) {
    alert('삭제할 창고를 선택하세요', { position: 'top-right', duration: 1000 });
    return;
  }
  const deleteRow = { WR_NO: selectedRows[0].창고번호 };

  if (window.confirm(`${selectedRows[0].창고명} 를 삭제하시겠습니까?`)) {
    try {
      internalRowData.value = internalRowData.value.filter((row) => row.창고번호 !== selectedRows[0].창고번호);
      await axios.post('/wrModalDelete', deleteRow);
      $toast.success('삭제 완료', { position: 'top-right', duration: 1000 });
      emit('deleted');
    } catch {
      $toast.error(`창고에 데이터가 있어서 삭제하지 못했습니다.`);
    }
  } else {
    console.log('삭제취소');
  }
};
// props의 데이터를 받을 내부 ref 변수 선언
const internalRowData = ref([]);
const internalColDefs = ref([]);
// 선택된 행
const selectedRow = ref(null);

// props가 변경될 때마다 내부 ref 변수를 업데이트
watch(
  () => props.rowData,
  (newVal) => {
    internalRowData.value = newVal;
  },
  { immediate: true } // 컴포넌트가 처음 로드될 때 바로 실행
);
watch(
  () => props.colDefs,
  (newVal) => {
    internalColDefs.value = newVal;
  },
  { immediate: true }
);

// 열기, 닫기
const open = () => {
  dialog.value = true;
};
const close = () => {
  dialog.value = false;
};
//
const addRow = () => {
  const newRow = {};
  internalRowData.value.push(newRow);
};

const update = async () => {
  // db저장
  const selectedRows = gridApi.getSelectedRows();
  if (selectedRows.length === 0) {
    $toast.error('추가할 행을 선택하세요');
    return;
  }
  const newRow = {
    WR_ADDR: selectedRows[0].창고주소,
    WR_NAME: selectedRows[0].창고명
  };
  const result = await axios.post('/wrModalInsert', newRow);
  console.log(result.config.data);
};

function onRowClicked(event) {
  selectedRow.value = event.data;
  console.log(selectedRow.value);
}

const emit = defineEmits(['confirm', 'deleted', 'update']);

// '확인' 버튼 클릭 시 로직
const confirm = () => {
  if (selectedRow.value) {
    emit('confirm', selectedRow.value);
    //confirm이라는 이름으로 selectedRow.value 데이터를 부모에게 전달.
  }
  close();
};

defineExpose({
  open
});
</script>
