import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlTileLayer from 'ol/layer/Tile';
import { transform } from 'ol/proj';
import OlOSM from 'ol/source/OSM';
import OlXYZ from 'ol/source/XYZ';
import { fromEvent, Subscription } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';

import OlImageWMS from 'ol/source/ImageWMS';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import ImageSource from 'ol/source/Image';
import { CommonModule } from '@angular/common';

import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { Point as OlPoint } from 'ol/geom';
import { Style, Circle as OlCircle, Fill, Stroke } from 'ol/style';


export class LayerModel {
  constructor(
    public name: string,
    public id: string,
    public layer: TileLayer | ImageLayer<ImageSource>,
    public isActive: boolean
  ) {}
}

// points.model.ts
export interface Point {
  Id: number;
  DrillingProjectId: number;
  WellNumber: string;
  Lat: number;
  Lon: number;
  X: number;
  Y: number;
  Z: number;
  Depth: number;
  Angle: number;
  Dx: number;
  Dy: number;
}


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatFormFieldModule,MatSelectModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  private map!: OlMap;
  public layersFC = new FormControl();
  public layers: LayerModel[] = [];
  public points: Point[] = [];


  private coordinates: { [key: string]: [number, number] } = {
    'wms_layer_may': [86.7236820, 53.9716230],
    'wms_layer_cher': [86.111312, 55.614120],  
    'wms_layer_salek': [86.6323350, 53.9997940]  
  };
  
  private mapSubscription!: Subscription;

  constructor(private elRef: ElementRef) {}

  ngOnInit(): void {
    this.initializeMap();

    this.initializeLayers();
    this.layersFC.valueChanges.subscribe(selectedLayers => {
      this.toggleLayers(selectedLayers);
    });

    this.centerMapOnPoints(this.points); 
  }

  private initializeMap(): void {
    const mapContainer = this.elRef.nativeElement.querySelector('#map');
    
    this.map = new OlMap({
      target: mapContainer,
      layers: [
        new OlTileLayer({
          source: new OlOSM(),
          className: 'osm_layer'
        })
      ],
      view: new OlView({
        center: transform([86.10487, 55.60702], 'EPSG:4326', 'EPSG:3857'),
        zoom: 14
      }),
      controls: []
    });

    this.points = [
      {
        "Id": 3193,
        "DrillingProjectId": 4,
        "WellNumber": "1",
        "Lat": 55.627078833311,
        "Lon": 86.1683409246918,
        "X": 86.1683409246918,
        "Y": 55.627078833311,
        "Z": 169.4652732834,
        "Depth": 12.0,
        "Angle": 0.0,
        "Dx": 0.0,
        "Dy": 0.0
      },
      {
        "Id": 3194,
        "DrillingProjectId": 4,
        "WellNumber": "2",
        "Lat": 55.6271324237352,
        "Lon": 86.1683309213025,
        "X": 86.1683309213025,
        "Y": 55.6271324237352,
        "Z": 169.5080735038,
        "Depth": 12.0,
        "Angle": 0.0,
        "Dx": 0.0,
        "Dy": 0.0
      }
    ];

    this.addPointsToMap();
  }

  private addPointsToMap(): void {
    const vectorSource = new VectorSource();
    
    this.points.forEach(point => {
      const feature = new Feature({
        geometry: new OlPoint(transform([point.Lon, point.Lat], 'EPSG:4326', 'EPSG:3857')),
        name: point.WellNumber
        
      });
      feature.setStyle(new Style({
        image: new OlCircle({
          radius: 7, 
          fill: new Fill({
            color: '#00FF1A' 
          }),
          stroke: new Stroke({
            color: '#000000', 
            width: 1 
          })
        })
      }));

      vectorSource.addFeature(feature);
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource
    });

    this.map.addLayer(vectorLayer);
    
  }


  private initializeLayers(): void {
    this.layers = [
      new LayerModel(
        'Базовый слой',
        'osm_layer',
        new OlTileLayer({ source: new OlOSM(), className: 'osm_layer', visible: true }),
        true
      ),
      new LayerModel(
        'Майский разрез',
        'wms_layer_may',
        new ImageLayer({ source: this.wmsSourceMay, className: 'wms_layer_may', visible: true }),
        true
      ),
      new LayerModel(
        'Черниговский разрез',
        'wms_layer_cher',
        new ImageLayer({ source: this.wmsSourceChernigov, className: 'wms_layer_cher', visible: true }),
        true
      ),
      new LayerModel(
        'Салек разрез',
        'wms_layer_salek',
        new ImageLayer({ source: this.wmsSourceSalek, className: 'wms_layer_salek', visible: true }),
        true
      ),
    ];
    
  }

  public toggleLayers(selectedLayer: LayerModel): void {
    const baseLayer = this.layers.find(layer => layer.id === 'osm_layer')?.layer as OlTileLayer;
    this.map.getLayers().clear();
    this.map.addLayer(baseLayer);
  
    if (selectedLayer && selectedLayer.isActive) {
      if (!this.map.getLayers().getArray().includes(selectedLayer.layer)) {
        this.map.addLayer(selectedLayer.layer);
      }

      if (this.coordinates[selectedLayer.id]) {
        const coord = transform(this.coordinates[selectedLayer.id], 'EPSG:4326', 'EPSG:3857');
        this.map.getView().animate({ center: coord, duration: 1000 });
      }
    }
  }
  
  ngOnDestroy(): void {
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
  }

  updateMapCenter(latitude: number, longitude: number): void {
    if (this.map) {
      const center = transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857');  
      this.map.getView().setCenter(center);
    }
  }

  centerMapOnPoints(points: Point[]): void {
    if (points.length === 0) return;
  
    // Вычислите средние координаты
    const latitudes = points.map(point => point.Lat);
    const longitudes = points.map(point => point.Lon);
    
    const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
    const avgLon = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;
  
    // Преобразуйте средние координаты в проекцию карты
    const center = transform([avgLon, avgLat], 'EPSG:4326', 'EPSG:3857');
  
    // Установите центр карты
    this.map.getView().animate({
      center: center,
      duration: 1000 // Продолжительность анимации
    });
  }

  private wmsSourceMay = new OlImageWMS({
    url: 'http://stage.v2grupp:8280/service',
    ratio: 1,
    serverType: 'geoserver',
    params: {
      LAYERS: 'may_all',
      FORMAT: 'image/png',
      TRANSPARENT: true,
      CRS: 'EPSG:3857',
    },
  });

  private wmsSourceSalek = new OlImageWMS({
    url: 'http://stage.v2grupp:8280/service',
    ratio: 1,
    serverType: 'geoserver',
    params: {
      LAYERS: 'salek_all',
      FORMAT: 'image/png',
      TRANSPARENT: true,
      CRS: 'EPSG:3857',
    },
  });

  private wmsSourceChernigov = new OlImageWMS({
    url: 'http://stage.v2grupp:8280/service',
    ratio: 1,
    serverType: 'geoserver',
    params: {
      LAYERS: 'cher_all',
      FORMAT: 'image/png',
      TRANSPARENT: true,
      CRS: 'EPSG:3857',
    },
  });


}

