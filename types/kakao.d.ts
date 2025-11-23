/**
 * Kakao Map SDK 타입 선언
 *
 * window.kakao 전역 객체에 대한 타입 정의
 */

interface KakaoMapsLatLng {
  new (lat: number, lng: number): KakaoMapsLatLng;
  getLat(): number;
  getLng(): number;
}

interface KakaoMapsSize {
  new (width: number, height: number): KakaoMapsSize;
}

interface KakaoMapsPoint {
  new (x: number, y: number): KakaoMapsPoint;
}

interface KakaoMapsMarkerImage {
  new (
    src: string,
    size: KakaoMapsSize,
    options?: { offset?: KakaoMapsPoint }
  ): KakaoMapsMarkerImage;
}

interface KakaoMapsMarker {
  new (options: {
    position: KakaoMapsLatLng;
    map?: KakaoMapsMap | null;
    image?: KakaoMapsMarkerImage;
  }): KakaoMapsMarker;
  setMap(map: KakaoMapsMap | null): void;
  setPosition(position: KakaoMapsLatLng): void;
  getPosition(): KakaoMapsLatLng;
}

interface KakaoMapsInfoWindow {
  new (options: { content: string; removable?: boolean }): KakaoMapsInfoWindow;
  open(map: KakaoMapsMap, marker?: KakaoMapsMarker): void;
  close(): void;
  getMap(): KakaoMapsMap | null;
}

interface KakaoMapsLatLngBounds {
  new (): KakaoMapsLatLngBounds;
  extend(latlng: KakaoMapsLatLng): void;
  isEmpty(): boolean;
  getSouthWest(): KakaoMapsLatLng;
  getNorthEast(): KakaoMapsLatLng;
}

interface KakaoMapsMapOptions {
  center: KakaoMapsLatLng;
  level: number;
}

interface KakaoMapsMap {
  new (container: HTMLElement, options: KakaoMapsMapOptions): KakaoMapsMap;
  setCenter(latlng: KakaoMapsLatLng): void;
  setLevel(level: number): void;
  setBounds(bounds: KakaoMapsLatLngBounds): void;
  getCenter(): KakaoMapsLatLng;
  getLevel(): number;
}

interface KakaoMapsEvent {
  addListener(
    target: KakaoMapsMarker | KakaoMapsMap | KakaoMapsRoadview,
    type: string,
    handler: () => void
  ): void;
  removeListener(
    target: KakaoMapsMarker | KakaoMapsMap | KakaoMapsRoadview,
    type: string,
    handler: () => void
  ): void;
}

interface KakaoMapsRoadviewClient {
  new (): KakaoMapsRoadviewClient;
  getNearestPanoId(
    position: KakaoMapsLatLng,
    radius: number,
    callback: (panoId: number | null, status: string) => void
  ): void;
}

interface KakaoMapsRoadview {
  new (
    container: HTMLElement,
    options?: { panoId?: number; panoX?: number; panoY?: number }
  ): KakaoMapsRoadview;
  setPanoId(panoId: number, position: KakaoMapsLatLng): void;
  relayout(): void;
}

interface KakaoMaps {
  maps: {
    LatLng: KakaoMapsLatLng;
    Size: KakaoMapsSize;
    Point: KakaoMapsPoint;
    MarkerImage: KakaoMapsMarkerImage;
    Marker: KakaoMapsMarker;
    InfoWindow: KakaoMapsInfoWindow;
    LatLngBounds: KakaoMapsLatLngBounds;
    Map: KakaoMapsMap;
    MapOptions: KakaoMapsMapOptions;
    RoadviewClient: KakaoMapsRoadviewClient;
    Roadview: KakaoMapsRoadview;
    event: KakaoMapsEvent;
    load(callback: () => void): void;
  };
}

declare global {
  interface Window {
    kakao?: KakaoMaps;
  }
}

export {};
