<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />

  <UiParentCard>
    <!-- 상단 버튼 -->
    <v-row justify="end" class="mb-2">
      <v-btn color="error" class="top_btn_ser" variant="elevated" @click="resetForm">초기화</v-btn>
      <v-btn color="primary" class="top_btn_ser" @click="saveForm">등록</v-btn>
    </v-row>

    <!-- 1) 검사기준 그리드 (체크박스=합격) -->
    <ag-grid-vue
      :rowData="criteriaRows"
      :columnDefs="criteriaCols"
      :defaultColDef="defaultColDef"
      :rowSelection="rowSelection"
      :gridOptions="criteriaGridOptions"
      :theme="quartz"
      style="height: 280px; width: 100%"
      @grid-ready="onCriteriaReady"
      @first-data-rendered="selectAllCriteria"
      @selection-changed="recalcCriteria"
    />

    <!-- 최종처리 -->
    <v-row class="my-4">
      <v-col cols="12" class="py-1">
        <div class="d-flex align-center">
          <h5 class="mr-4">최종처리</h5>
          <v-chip :color="finalStatus === '합격' ? 'primary' : 'error'">{{ finalStatus }}</v-chip>
          <span class="ml-auto text-caption">선택 {{ selectedCount }}/{{ totalCount }}</span>
        </div>
      </v-col>
    </v-row>

    <!-- 불합격 사유 입력 섹션 -->
    <v-card v-show="finalStatus === '불합격'" class="mb-4" elevation="2">
      <v-card-title class="bg-red-lighten-5 text-red-darken-2">불합격 사유</v-card-title>
      <v-card-text>
        <v-textarea
          v-model="defectReason.description"
          label="불합격 사유"
          variant="outlined"
          rows="3"
          counter="500"
          maxlength="500"
          :rules="[(v) => finalStatus === '합격' || (v && v.length > 0) || '불합격 시 사유는 필수입니다.']"
        />
      </v-card-text>
    </v-card>

    <!-- 2) 하단 입력 그리드(1행) -->
    <ag-grid-vue
      :rowData="detailRows"
      :columnDefs="detailCols"
      :gridOptions="detailGridOptions"
      :theme="quartz"
      style="height: 160px; width: 100%"
    />
  </UiParentCard>
</template>

<script setup>
import axios from 'axios';
import { ref, shallowRef, computed, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

import { useRoute } from 'vue-router';
import { AgGridVue } from 'ag-grid-vue3';
import { ModuleRegistry, themeQuartz, ClientSideRowModelModule, RowSelectionModule, ValidationModule } from 'ag-grid-community';

// 모듈 등록
ModuleRegistry.registerModules([ClientSideRowModelModule, RowSelectionModule, ...(import.meta.env.PROD ? [] : [ValidationModule])]);

const quartz = themeQuartz;
const route = useRoute();

/* breadcrumb */
const page = ref({ title: '제품 검수관리 등록' });
const breadcrumbs = ref([
  { title: '품질', disabled: true, href: '#' },
  { title: '제품 검수관리 등록', disabled: false, href: '#' }
]);

/* ------------ 1) 검사기준 그리드 (선택=합격) ------------ */
// 행 데이터 (고유한 _id 사용)
const criteriaRows = ref([
  { _id: 'moisture', label: '함수율', allow: '수분 함량 12~15% (KS범위)', value: '' },
  { _id: 'dimension', label: '치수정밀도', allow: '입고자재 ±2mm 이내', value: '' },
  { _id: 'strength', label: '강도/내구성', allow: '횡강도 35MPa 이상', value: '' },
  { _id: 'stability', label: '안정성', allow: '전도 없음, 전기부 안전, 모서리 등금 위험요소 없음', value: '' },
  { _id: 'defects', label: '왼관 결점', allow: '옹이, 할렬, 긁힘 육안확인 시 결점이 없을 시', value: '' },
  { _id: 'formaldehyde', label: '포름알데히드 방출률', allow: '친환경 E0 등급(0.3mg/L)이하', value: '' },
  { _id: 'surface', label: '표면 마감/도장', allow: '도맏 들뜸 박리 없음, 균일한 색상 광택 유지', value: '' }
]);

const criteriaApi = shallowRef(null);

const defaultColDef = ref({
  resizable: true,
  minWidth: 120,
  sortable: false
});

const rowSelection = ref('multiple');

const criteriaCols = ref([
  { headerName: '검사명', field: 'label', minWidth: 160, flex: 1 },
  { headerName: '허용수치', field: 'allow', minWidth: 360, flex: 2 },
  { headerName: '측정값', field: 'value', minWidth: 360, flex: 2, editable: true },
  {
    headerName: '판정',
    colId: 'result',
    minWidth: 120,
    maxWidth: 140,
    valueGetter: (p) => (p.node?.isSelected() ? '합격' : '불합격'),
    cellClass: (p) => (p.value == '합격' ? 'ag-cell-success' : 'ag-cell-error'),
    sortable: false
  },
  {
    headerName: '선택',
    checkboxSelection: true,
    headerCheckboxSelection: true,
    width: 80,
    pinned: 'right',
    suppressMenu: true,
    sortable: false,
    filter: false
  }
]);

const criteriaGridOptions = ref({
  defaultColDef: defaultColDef.value,
  rowSelection: 'multiple',
  suppressRowClickSelection: true,
  getRowId: (params) => params.data._id
});

// 합격/불합격 계산
const totalCount = ref(0);
const selectedCount = ref(0);
const finalStatus = computed(() => (selectedCount.value === totalCount.value ? '합격' : '불합격'));

function onCriteriaReady(e) {
  criteriaApi.value = e.api;
  console.log('AG-Grid 준비 완료');
}

function selectAllCriteria(e) {
  try {
    // 기본값: 전부 합격(전체 선택)
    e.api.selectAll();
    recalcCriteria();
  } catch (error) {
    console.error('전체 선택 오류:', error);
  }
}

function recalcCriteria() {
  const api = criteriaApi.value;
  if (!api) return;

  try {
    totalCount.value = api.getDisplayedRowCount();
    selectedCount.value = api.getSelectedNodes().length;
    api.refreshCells({ columns: ['result'], force: true });
    console.log(`재계산 완료: ${selectedCount.value}/${totalCount.value}, 상태: ${finalStatus.value}`);
  } catch (error) {
    console.error('재계산 오류:', error);
  }
}

/* ------------ 2) 하단 입력 그리드(1행) ------------ */
const detailRows = ref([
  {
    certid: '(자동생성)',
    tpId: 0,
    prdCode: '',
    prdName: '',
    prdType: '',
    totalQty: 0,
    writer: '',
    finished_at: '',
    certDate: ''
  }
]);

const detailCols = ref([
  { headerName: '제품검사번호', field: 'certid', width: 170, editable: false },
  { headerName: '제품코드', field: 'prdCode', width: 140, editable: false },
  { headerName: '제품명', field: 'prdName', width: 150, editable: false },
  { headerName: '제품유형', field: 'prdType', width: 150, editable: false },
  { headerName: '총수량', field: 'totalQty', width: 110, editable: false, valueParser: numParser },
  { headerName: '작업자', field: 'writer', width: 120, editable: false },
  { headerName: '생산완료일자', field: 'finished_at', width: 140, editable: false },
  { headerName: '검사완료일자', field: 'certDate', width: 140, editable: false }
]);

function numParser(p) {
  const v = Number(String(p.newValue).replace(/,/g, '').trim());
  return Number.isFinite(v) ? v : p.oldValue;
}

const detailGridOptions = ref({
  defaultColDef: { resizable: true, minWidth: 110 },
  autoSizeStrategy: { type: 'fitGridWidth' }
});

// 불합격 사유 관련 데이터
const defectReason = ref({
  description: ''
});

// 수정된 초기화 함수 - 전체 선택으로 변경
function resetForm() {
  try {
    // 검사기준: 전부 합격으로 초기화 (전체 선택)
    const api = criteriaApi.value;
    if (api) {
      api.selectAll(); // deselectAll() -> selectAll()로 변경
      recalcCriteria();
    }

    // 불합격 사유 초기화
    defectReason.value.description = '';

    // 측정값 초기화
    criteriaRows.value.forEach((row) => {
      row.value = '';
    });

    console.log('폼이 초기화되었습니다. (전체 합격 상태)');
  } catch (error) {
    console.error('초기화 오류:', error);
  }
}

async function saveForm() {
  try {
    const d = detailRows.value[0];
    const isPass = finalStatus.value === '합격';

    console.log('[saveForm] 시작 - 상태:', finalStatus.value, 'isPass:', isPass);
    console.log('[saveForm] 선택된 항목 수:', selectedCount.value, '/', totalCount.value);

    // 불합격이면 사유 필수 검증
    if (!isPass && !defectReason.value.description.trim()) {
      alert('불합격 사유를 입력해주세요.');
      return;
    }

    // 검사기준 결과 수집
    const api = criteriaApi.value;
    const results = [];
    if (api) {
      api.forEachNode((node) => {
        const r = node.data;
        results.push({
          stdName: r.label,
          allowedItem: r.allow,
          measuredValue: String(r.value ?? ''),
          status: node.isSelected() ? '합격' : '불합격'
        });
      });
    }
    console.log('[saveForm] 검사 결과:', results);

    // detailRows 데이터 사용하도록 수정
    if (isPass) {
      // 합격 처리
      const payload = {
        TP_ID: d.tpId,
        PRD_CODE: d.prdCode,
        PRD_NAME: d.prdName,
        PRD_TYPE: d.prdType,
        TOTAL_QTY: d.totalQty,
        Q_CHECKED_DATE: d.certDate,
        CREATED_BY: d.writer
      };

      console.log('[saveForm] POST /passprd', payload);
      const response = await axios.post('http://localhost:3000/passprd', payload);

      if (response.data.ok) {
        alert('합격 제품이 등록되었습니다!');
      }
    } else {
      // 불합격 처리
      const payload = {
        TP_ID: d.tpId,
        PRD_CODE: d.prdCode,
        PRD_NAME: d.prdName,
        PRD_TYPE: d.prdType,
        TOTAL_QTY: d.totalQty,
        Q_CHECKED_DATE: d.certDate,
        CREATED_BY: d.writer,
        RJT_REASON: defectReason.value.description.trim()
      };

      console.log('[saveForm] POST /rejectprd', payload);
      const response = await axios.post('http://localhost:3000/rejectprd', payload);

      if (response.data.ok) {
        alert('불합격 제품이 등록되었습니다!');
        console.log('등록된 인증서 ID:', response.data.prdCertId);
      }
    }
  } catch (err) {
    console.error('[saveForm] ERROR:', err);

    // 에러 응답에서 메시지 추출
    let errorMessage = '등록 중 오류가 발생했습니다.';
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }

    alert(errorMessage);
  }
}

// 컴포넌트 마운트 시 초기화
onMounted(() => {
  try {
    const r = detailRows.value[0];
    r.tpId = Number(route.query.wo_no || 0);
    r.prdCode = String(route.query.product_code || '');
    r.prdName = String(route.query.product_name || '');
    r.prdType = String(route.query.product_type || '');
    r.totalQty = Number(route.query.qty || 0);
    r.writer = String(route.query.writer || '');
    r.finished_at = String(route.query.finished_at || '');
    r.certDate = new Date().toISOString().slice(0, 10);

    console.log('초기 데이터 로드 완료:', r);
  } catch (error) {
    console.error('초기 데이터 로드 오류:', error);
  }
});
</script>

<style scoped>
.top_btn_ser {
  margin-left: 8px;
}
.fw-600 {
  font-weight: 600;
}
.mr-4 {
  margin-right: 16px;
}
.ml-auto {
  margin-left: auto;
}
.ag-cell-success {
  color: #2e7d32;
  font-weight: 600;
}
.ag-cell-error {
  color: #d32f2f;
  font-weight: 600;
}
</style>
