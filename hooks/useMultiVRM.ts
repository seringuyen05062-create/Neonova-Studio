'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { VRM } from '@pixiv/three-vrm';
import { VRMLoader } from '@/lib/vrm-loader';

/**
 * Tối đa 3 model:
 *  - index 0: model chính (có LipSyncController)
 *  - index 1,2: model phụ (không LipSync)
 */
const MAX_MODELS = 3;

type VRMSource = File | string;

type SlotState = {
  vrm: VRM | null;
  isLoading: boolean;
  error: string | null;
  // token để chống race-condition (mỗi lần load tăng 1)
  token: number;
};

export function useMultiVRM() {
  // Khởi tạo 3 slot rỗng
  const [slots, setSlots] = useState<SlotState[]>(
    Array.from({ length: MAX_MODELS }, () => ({
      vrm: null,
      isLoading: false,
      error: null,
      token: 0,
    }))
  );

  // VRMLoader nên tạo mới cho mỗi lần load để an toàn
  const loaderRef = useRef<VRMLoader | null>(null);
  const getLoader = () => {
    if (!loaderRef.current) loaderRef.current = new VRMLoader();
    return loaderRef.current;
  };

  /**
   * Hủy & giải phóng tài nguyên của một VRM
   */
  const disposeVRM = useCallback((vrm: VRM | null) => {
    if (!vrm) return;
    try {
      // three-vrm không có .dispose() tổng quát; ta dispose geometry/material
      vrm.scene.traverse((obj: any) => {
        if (obj.isMesh) {
          // geometry
          obj.geometry?.dispose?.();
          // material (có thể là array)
          const mat = obj.material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => {
              // texture map…
              m?.map?.dispose?.();
              m?.normalMap?.dispose?.();
              m?.metalnessMap?.dispose?.();
              m?.roughnessMap?.dispose?.();
              m?.emissiveMap?.dispose?.();
              m?.dispose?.();
            });
          } else if (mat) {
            mat.map?.dispose?.();
            mat.normalMap?.dispose?.();
            mat.metalnessMap?.dispose?.();
            mat.roughnessMap?.dispose?.();
            mat.emissiveMap?.dispose?.();
            mat.dispose?.();
          }
        }
      });
      // Optionally: detach scene khỏi graph nếu bạn có scene parent
      // (nhưng trong R3F, React sẽ quản lý unmount)
    } catch (e) {
      console.warn('[useMultiVRM] disposeVRM warning:', e);
    }
  }, []);

  /**
   * Load 1 VRM vào slot idx (0..2)
   */
  const loadVRM = useCallback(async (idx: number, source: VRMSource) => {
    if (idx < 0 || idx >= MAX_MODELS) {
      throw new Error(`idx phải trong khoảng 0..${MAX_MODELS - 1}`);
    }

    // tạo token mới cho slot này để chống race
    const currentToken = slots[idx]?.token + 1; // tính toán token trước
    setSlots((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], isLoading: true, error: null, token: currentToken };
      return next;
    });

    const loader = getLoader();

    try {
      const loadedVRM = await loader.loadVRM(source);

      // Kiểm tra token: nếu trong lúc chờ, người dùng đã bấm load lần khác, bỏ qua kết quả cũ
      setSlots((prev) => {
        const latest = prev[idx];
        if (latest.token !== currentToken) {
          // token mismatch -> bỏ
          // vẫn dispose VRM vừa load (tránh leak)
          disposeVRM(loadedVRM);
          return prev;
        }

        // dispose VRM cũ nếu có
        if (latest.vrm && latest.vrm !== loadedVRM) {
          disposeVRM(latest.vrm);
        }

        const next = [...prev];
        next[idx] = {
          ...latest,
          vrm: loadedVRM,
          isLoading: false,
          error: null,
        };
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load VRM';
      setSlots((prev) => {
        const latest = prev[idx];
        // chỉ cập nhật nếu token khớp
        if (latest.token !== currentToken) return prev;
        const next = [...prev];
        next[idx] = { ...latest, isLoading: false, error: msg };
        return next;
      });
    }
  }, [disposeVRM, slots]);

  /**
   * Bỏ VRM ở slot idx
   */
  const unloadVRM = useCallback((idx: number) => {
    if (idx < 0 || idx >= MAX_MODELS) return;
    setSlots((prev) => {
      const next = [...prev];
      const old = next[idx];
      if (old.vrm) disposeVRM(old.vrm);
      next[idx] = { vrm: null, isLoading: false, error: null, token: old.token + 1 };
      return next;
    });
  }, [disposeVRM]);

  /**
   * Bỏ tất cả VRM
   */
  const unloadAll = useCallback(() => {
    setSlots((prev) => {
      prev.forEach((s) => disposeVRM(s.vrm));
      return Array.from({ length: MAX_MODELS }, () => ({
        vrm: null,
        isLoading: false,
        error: null,
        token: 0,
      }));
    });
  }, [disposeVRM]);

  // mảng vrms + loading + error để dễ dùng
  const vrms = useMemo(() => slots.map((s) => s.vrm), [slots]);
  const byIndex = useMemo(
    () => ({
      get: (idx: number) => (idx >= 0 && idx < MAX_MODELS ? slots[idx].vrm : null),
      isLoading: (idx: number) => (idx >= 0 && idx < MAX_MODELS ? slots[idx].isLoading : false),
      error: (idx: number) => (idx >= 0 && idx < MAX_MODELS ? slots[idx].error : null),
    }),
    [slots]
  );

  // Tương thích với hook cũ
  const loadedCount = vrms.filter(vrm => vrm !== null).length;
  const isAnyLoading = slots.some(slot => slot.isLoading);
  const loadingStates = slots.map(slot => slot.isLoading);
  const errors = slots.map(slot => slot.error);

  return {
    // API mới (khuyên dùng)
    vrms,
    byIndex,
    loadVRM,
    unloadVRM,
    unloadAll,
    MAX_MODELS,

    // API cũ để tương thích
    loadedCount,
    isAnyLoading,
    loadingStates,
    errors,
    getMainVRM: () => byIndex.get(0),
    getLoadedVRMs: () => vrms.filter(vrm => vrm !== null) as VRM[],
    unloadAllVRMs: unloadAll,
    MAX_VRM_COUNT: MAX_MODELS,
  };
}