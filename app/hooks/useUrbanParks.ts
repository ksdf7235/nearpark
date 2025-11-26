"use client";

/**
 * Supabase에서 공원 데이터를 가져오는 React 훅
 * 
 * 반경 내 공원 검색, 필터링, 로딩 상태 관리 등을 제공합니다.
 */

import { useState, useEffect, useCallback } from "react";
import type { Place } from "../types/place";
import {
  searchUrbanParks,
  getUrbanParkById,
  type SearchUrbanParksOptions,
} from "../services/supabase";

/**
 * 공원 검색 훅의 반환 타입
 */
export interface UseUrbanParksResult {
  places: Place[];
  loading: boolean;
  error: string | null;
  search: (options: SearchUrbanParksOptions) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * 공원 검색 옵션 (마지막 검색 옵션 저장용)
 */
let lastSearchOptions: SearchUrbanParksOptions | null = null;

/**
 * 반경 내 공원을 검색하는 훅
 * 
 * @param initialOptions - 초기 검색 옵션 (선택사항)
 * @returns 공원 목록, 로딩 상태, 에러, 검색 함수
 * 
 * @example
 * const { places, loading, error, search } = useUrbanParks();
 * 
 * useEffect(() => {
 *   search({ lat: 37.5665, lng: 126.9780, radius: 2000 });
 * }, []);
 */
export function useUrbanParks(
  initialOptions?: SearchUrbanParksOptions
): UseUrbanParksResult {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (options: SearchUrbanParksOptions) => {
    setLoading(true);
    setError(null);
    lastSearchOptions = options;

    try {
      const results = await searchUrbanParks(options);
      setPlaces(results);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "공원 검색 중 오류가 발생했습니다.";
      setError(errorMessage);
      console.error("공원 검색 오류:", err);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (lastSearchOptions) {
      await search(lastSearchOptions);
    }
  }, [search]);

  // 초기 옵션이 있으면 자동으로 검색
  useEffect(() => {
    if (initialOptions) {
      search(initialOptions);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    places,
    loading,
    error,
    search,
    refresh,
  };
}

/**
 * ID로 공원을 조회하는 훅
 * 
 * @param id - 공원 ID
 * @returns 공원 정보, 로딩 상태, 에러
 * 
 * @example
 * const { place, loading, error } = useUrbanPark("30170-00083");
 */
export function useUrbanPark(id: string | null) {
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setPlace(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    getUrbanParkById(id)
      .then((result) => {
        if (result) {
          setPlace(result);
        } else {
          setError("공원을 찾을 수 없습니다.");
        }
      })
      .catch((err) => {
        const errorMessage =
          err instanceof Error ? err.message : "공원 조회 중 오류가 발생했습니다.";
        setError(errorMessage);
        console.error("공원 조회 오류:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return { place, loading, error };
}

