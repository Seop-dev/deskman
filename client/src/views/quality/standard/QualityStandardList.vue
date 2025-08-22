<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard>
    <!-- 상단 툴바 -->
    <div class="toolbar">
      <div class="filters">
        <v-row>
          <v-col cols="3">
            <v-text-field v-model="search.keyword" label="기준" @keyup.enter="onSearch" dense outlined />
          </v-col>
          <v-col cols="3">
            <v-select v-model="search.type" :items="productTypes" label="제품 구분" density="compact" clearable />
          </v-col>
          <v-col cols="3">
            <v-btn class="ml-2" color="darkText" @click="onSearch">검색</v-btn>
            <v-btn class="ml-2" @click="onReset">초기화</v-btn>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- 그리드 -->
    <div class="grid-wrap">
      <ag-grid-vue
        :theme="quartz"
        :columnDefs="colDefs"
        :rowData="qcStdRowData"
        :gridOptions="gridOptions"
        rowSelection="single"
        @grid-ready="onGridReady"
        style="height: 420px; width: 100%"
      />
    </div>
  </UiParentCard>
</template>

<script setup>
import axios from 'axios';
import { ref, shallowRef, watch, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

// 페이지 상단
const page = ref({ title: '품질 기준 조회' });
const breadcrumbs = shallowRef([
  { title: '품질', disabled: true, href: '#' },
  { title: '품질 기준 조회', disabled: false, href: '#' }
]);

// 동적 드롭다운 & 필터 전 원본 데이터
const productTypes = ref([]); // v-select items
const rawRows = ref([]); // 서버 전체 결과(필터 전)

// 컬럼 정의 (원하시면 제품 구분 컬럼도 표시 가능)
const colDefs = ref([
  { headerName: '기준명', field: 'stdName', flex: 1, suppressSizeToFit: true },
  { headerName: '허용수치', field: 'allowedValue', flex: 1, suppressSizeToFit: true }
]);

const qcStdRowData = ref([]);

// 검색 상태
const search = ref({
  keyword: '', // 기준(입력란)
  type: '' // 제품 구분 선택
});

// /qstdlist 한 번만 호출해서 드롭다운 + 그리드 원본 구성
const getQStandardList = async () => {
  try {
    const url = 'http://localhost:3000/qstdlist';
    const { data } = await axios.get(url);
    const rows = (data || []).map((item) => ({
      type: item.std_type ?? item.CODE_NAME ?? item.code_name, // 제품 구분
      stdName: item.STD_NAME,
      allowedValue: item.ALLOWED_VALUE
    }));

    rawRows.value = rows;

    // 드롭다운 items: type 유니크 추출
    productTypes.value = [...new Set(rows.map((r) => r.type).filter(Boolean))];

    // 초기 렌더(필터 미적용 = 전체)
    applyFilters();
  } catch (err) {
    console.error('데이터 조회 중 오류:', err);
    rawRows.value = [];
    productTypes.value = [];
    qcStdRowData.value = [];
  }
};

// 공통 필터(타입, 키워드)
const applyFilters = () => {
  let rows = [...rawRows.value];

  if (search.value.type) {
    rows = rows.filter((r) => r.type === search.value.type);
  }
  if (search.value.keyword) {
    const kw = search.value.keyword.toLowerCase();
    rows = rows.filter((r) => (r.stdName || '').toLowerCase().includes(kw));
  }

  qcStdRowData.value = rows;

  if (gridApi) {
    gridApi.setGridOption('rowData', rows);
  }
};

// ag-Grid 옵션
const gridOptions = ref({
  defaultColDef: {
    resizable: true,
    sortable: true
  },
  pagination: false,
  animateRows: true
});

let gridApi = null;

// 그리드 준비 이벤트
const onGridReady = (e) => {
  gridApi = e.api;
};

// 컴포넌트 마운트 시 초기 데이터 로드
onMounted(() => {
  getQStandardList();
});

// 타입 변경 시 자동 필터
watch(
  () => search.value.type,
  () => applyFilters()
);

// 검색 버튼 클릭
const onSearch = () => {
  applyFilters();
};

// 초기화 버튼 클릭
const onReset = () => {
  search.value.keyword = '';
  search.value.type = '';
  applyFilters(); // rawRows 유지 상태에서 전체 표시
};
</script>

<style scoped>
.toolbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}

.filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.grid-wrap {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
}

/* 인쇄 시 상단 툴바 감춤 */
@media print {
  .toolbar {
    display: none;
  }
}
</style>
