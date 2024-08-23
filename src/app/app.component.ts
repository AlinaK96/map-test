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

export class LayerModel {
  constructor(
    public name: string,
    public id: string,
    public layer: TileLayer | ImageLayer<ImageSource>,
    public isActive: boolean
  ) {}
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

