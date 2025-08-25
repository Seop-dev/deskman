<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
  <UiParentCard>
    <!-- 상단 버튼 -->
    <v-row>
      <v-col cols="3">
        <v-select v-model="search.type" :items="productTypes" label="제품 구분" density="compact" clearable />
      </v-col>
      <v-col cols="auto" class="d-flex justify-end">
        <v-btn class="ml-2" color="primary" @click="saveForm">등록</v-btn>
      </v-col>
    </v-row>

    <!-- 상단 그리드: 카테고리 목록 -->
    <div class="grid-wrap">
      <ag-grid-vue
        :theme="quartz"
        style="height: 420px; width: 100%"
        :columnDefs="colDefs"
        :rowData="currentRowData"
        :defaultColDef="defaultColDef"
        :gridOptions="gridOptions"
        rowSelection="single"
        :suppressRowClickSelection="false"
        @grid-ready="onMainGridReady"
        @selection-changed="onMainSelectionChanged"
        @cell-value-changed="onMainCellValueChanged"
      />
    </div>
    <br />

    <!-- 하단 그리드: 선택행 1건 (선택된 행이 있을 때만 표시) -->
    <div v-if="selectedRow" class="grid-wrap" style="margin-top: 12px">
      <div style="padding: 10px; background-color: #f5f5f5; font-weight: bold">선택한 기준</div>
      <v-row justify="end" class="mb-2 pa-2">
        <v-btn color="error" class="top_btn_ser" variant="elevated" @click.stop="resetDetailForm">입력초기화</v-btn>
        <v-btn color="primary" class="top_btn_ser" @click.stop="handleApplyChanges">상단에 반영</v-btn>
      </v-row>
      <ag-grid-vue
        style="height: 120px"
        :theme="quartz"
        :rowData="detailRows"
        :columnDefs="detailColDefs"
        :defaultColDef="detailDefaultColDef"
        :singleClickEdit="true"
        :stopEditingWhenCellsLoseFocus="true"
        @grid-ready="onDetailGridReady"
        @cell-value-changed="onDetailCellValueChanged"
        @cell-editing-stopped="onDetailCellEditingStopped"
      />
    </div>
  </UiParentCard>
</template>

<script setup>
import axios from 'axios';
import { ref, shallowRef, computed, watch, nextTick, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';

// 토스트
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-bootstrap.css';
const $toast = useToast();

ModuleRegistry.registerModules([AllCommunityModule]);
const quartz = themeQuartz;

// 페이지 정보
const page = ref({ title: '품질 기준 관리' });
const breadcrumbs = shallowRef([
  { title: '품질', disabled: true, href: '#' },
  { title: '품질 기준 관리', disabled: false, href: '#' }
]);

/**
 * 서버 데이터 상태
 */
const rawRows = ref([]);
const productTypes = ref([]);
const groupedMap = ref({}); // 완제품/반제품/원목/합판
const pendingUpdates = ref(new Map()); // 상단 반영된 변경사항을 임시로 모아두는 저장소
const makeKey = (type, originalStdName) => `${type}|||${originalStdName}`;

// 검색 조건
const search = ref({ type: '' });

// 상단 그리드 컬럼 정의 - 필드명을 데이터와 일치시킴
const colDefs = ref([
  { field: '기준', flex: 0.9, headerName: '기준', editable: false },
  { field: '허용수치', flex: 1.3, headerName: '허용수치', editable: false }
]);

// 상단 그리드 기본 설정
const defaultColDef = ref({
  resizable: true,
  sortable: true
});

const gridOptions = ref({
  defaultColDef: defaultColDef.value,
  getRowId: (p) => p.data._id,
  deltaRowDataMode: true
});

// 하단 그리드 컬럼 정의 - 필드명을 데이터와 일치시킴
const detailColDefs = ref([
  { field: '기준', flex: 0.9, headerName: '기준', editable: true },
  { field: '허용수치', flex: 1.3, headerName: '허용수치', editable: true }
]);

// 하단 그리드 기본 설정
const detailDefaultColDef = ref({
  resizable: true,
  sortable: false,
  filter: false
});

// 현재 선택된 타입의 데이터
const currentRowData = computed(() => {
  const type = search.value.type;
  if (!type) return [];
  return groupedMap.value[type] || [];
});

// 그리드 API 참조
let mainApi = null;

// 메인 그리드 준비
const onMainGridReady = (params) => {
  mainApi = params.api;
  // 첫 행 자동 선택
  nextTick(() => {
    if (params.api.getDisplayedRowCount() > 0) {
      params.api.selectIndex(0);
    }
  });
};

// 선택된 행 상태
const selectedRow = ref(null);
const originalSelectedRow = ref(null);

// 메인 그리드 선택 변경
const onMainSelectionChanged = (params) => {
  const selected = params.api.getSelectedRows();
  if (selected.length > 0) {
    selectedRow.value = { ...selected[0] };
    originalSelectedRow.value = { ...selected[0] };
  } else {
    selectedRow.value = null;
    originalSelectedRow.value = null;
  }
};

// 하단 그리드 데이터 (선택 1건만 표시)
const detailRows = computed(() => (selectedRow.value ? [selectedRow.value] : []));

// 하단 그리드 API 참조
let detailApi = null;

// 하단 그리드 준비
const onDetailGridReady = (params) => {
  detailApi = params.api;
};

// 하단 그리드 셀 값 변경
const onDetailCellValueChanged = (params) => {
  const field = params.colDef.field;
  const newValue = params.newValue;
  console.log(`Detail cell changed: ${field} = ${newValue}`);

  // Vue의 반응성을 우회하여 직접 업데이트
  if (selectedRow.value) {
    selectedRow.value = { ...selectedRow.value, [field]: newValue };
  }
};

// 하단 그리드 편집 완료 이벤트
const onDetailCellEditingStopped = (params) => {
  const field = params.colDef.field;
  const newValue = params.newValue;
  console.log('Cell editing stopped:', field, newValue);

  // 편집이 완료된 후 데이터 동기화
  if (selectedRow.value && newValue !== undefined) {
    selectedRow.value = { ...selectedRow.value, [field]: newValue };
  }
};

// 상단 그리드 셀 값 변경 방지
const onMainCellValueChanged = () => {
  if (mainApi) mainApi.refreshCells();
};

// 상단에 반영 버튼 클릭 핸들러
const handleApplyChanges = (event) => {
  // 이벤트 전파 중단
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // setTimeout을 사용하여 이벤트 루프에서 분리
  setTimeout(() => {
    applyChanges();
  }, 10);
};

// 상단에 반영: UI 갱신 + pending에 저장
const applyChanges = async () => {
  try {
    // AG-Grid 편집 상태 강제 완료
    if (detailApi) {
      detailApi.stopEditing();
      // 편집 완료를 위한 대기
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (!selectedRow.value || !originalSelectedRow.value) {
      $toast.warning('선택된 항목이 없습니다.', { position: 'top-right', duration: 1000 });
      return;
    }

    const type = search.value.type;
    const list = groupedMap.value[type] || [];
    const idx = list.findIndex((r) => r._id === originalSelectedRow.value._id);
    if (idx === -1) {
      $toast.warning('해당 데이터를 찾을 수 없습니다', { position: 'top-right', duration: 1000 });
      return;
    }

    // 화면 반영
    const before = { ...originalSelectedRow.value };
    const after = { ...selectedRow.value };
    const newList = [...list];
    newList[idx] = after;

    // 상태 업데이트
    groupedMap.value = { ...groupedMap.value, [type]: newList };
    originalSelectedRow.value = { ...after };

    // 등록 시 사용할 변경사항을 pending에 저장
    const key = makeKey(type, before['기준']);
    pendingUpdates.value.set(key, {
      TYPE: type,
      STD_NAME: after['기준'],
      ALLOWED_VALUE: after['허용수치'],
      ORIGINAL_STD_NAME: before['기준']
    });

    console.log('Applied changes:', {
      before,
      after,
      pendingUpdate: pendingUpdates.value.get(key)
    });

    $toast.info('상단에 반영되었습니다. 등록 버튼을 눌러 저장하세요', { position: 'top-right', duration: 1000 });

    // 상단 그리드 리프레시는 Vue의 반응성에 맡김
    await nextTick();
  } catch (error) {
    console.error('Apply changes error:', error);
    $toast.error('변경사항 반영 중 오류가 발생했습니다.', { position: 'top-right', duration: 2000 });
  }
};

// 등록: pending 내용을 실제 DB에 반영
const saveForm = async () => {
  const updates = Array.from(pendingUpdates.value.values());
  if (updates.length === 0) {
    $toast.warning('저장할 변경사항이 없습니다', { position: 'top-right', duration: 1000 });
    return;
  }

  try {
    console.log('Saving updates:', updates);

    for (const payload of updates) {
      console.log('Sending payload:', payload);
      const response = await axios.post('http://localhost:3000/qstdupdate', payload);
      console.log('Server response:', response.data);
    }

    pendingUpdates.value.clear();
    $toast.success('변경사항이 저장되었습니다', { position: 'top-right', duration: 1000 });

    // 서버 재조회로 싱크 맞춤
    await qcStandard();
  } catch (e) {
    console.error('저장 실패:', e);
    $toast.error('저장 중 오류가 발생했습니다: ' + (e.response?.data?.message || e.message), {
      position: 'top-right',
      duration: 3000
    });
  }
};

// 등록 입력 초기화
const resetDetailForm = () => {
  if (originalSelectedRow.value) {
    selectedRow.value = { ...originalSelectedRow.value };
  }
};

// 제품 구분 변경 시 선택 초기화 + 첫 행 자동 선택
watch(
  () => search.value.type,
  () => {
    selectedRow.value = null;
    originalSelectedRow.value = null;

    if (mainApi) {
      nextTick(() => {
        if (mainApi.getDisplayedRowCount() > 0) {
          mainApi.selectIndex(0);
        }
      });
    }
  }
);

// 초기 데이터 로드
const qcStandard = async () => {
  try {
    const url = 'http://localhost:3000/qstdlist';
    const { data } = await axios.get(url);

    console.log('Received data:', data);

    const rows = (data || []).map((r) => {
      const type = r.std_type ?? r.CODE_NAME ?? r.code_name;
      const stdName = r.STD_NAME;
      const allowed = r.ALLOWED_VALUE;
      const id = `${type}|${stdName}`;
      return {
        _id: id,
        type,
        기준: stdName,
        허용수치: allowed
      };
    });

    rawRows.value = rows;

    const types = [...new Set(rows.map((v) => v.type).filter(Boolean))];
    productTypes.value = types;

    if (!search.value.type && types.length > 0) {
      search.value.type = types[0];
    }

    const group = {};
    for (const row of rows) {
      const t = row.type || '기타';
      if (!group[t]) group[t] = [];
      group[t].push(row);
    }
    groupedMap.value = group;

    console.log('Grouped data:', groupedMap.value);
  } catch (err) {
    console.error('/qstdlist 조회 실패:', err);
    rawRows.value = [];
    productTypes.value = [];
    groupedMap.value = {};
  }
};

onMounted(() => {
  qcStandard();
});
</script>

<style scoped>
.grid-wrap {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
}

.top_btn_ser {
  margin-right: 10px;
}

.mb-2.pa-2 {
  margin-top: 10px;
}
</style>
