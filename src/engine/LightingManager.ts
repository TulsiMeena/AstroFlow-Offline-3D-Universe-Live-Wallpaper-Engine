import * as THREE from 'three';
import { QualityConfig } from '../types/engine';

export class LightingManager {
  private ambientLight: THREE.AmbientLight;
  private primaryLight: THREE.DirectionalLight;
  private secondaryLight: THREE.DirectionalLight;
  private pointLights: THREE.PointLight[] = [];
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'LightingGroup';

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.group.add(this.ambientLight);

    this.primaryLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
    this.primaryLight.position.set(5, 8, 7);
    this.group.add(this.primaryLight);

    this.secondaryLight = new THREE.DirectionalLight(0x7000ff, 0.8);
    this.secondaryLight.position.set(-5, -6, 5);
    this.group.add(this.secondaryLight);
  }

  public attachToScene(scene: THREE.Scene) {
    scene.add(this.group);
  }

  public setColors(ambient: number, primary: number, secondary: number) {
    this.ambientLight.color.setHex(ambient);
    this.primaryLight.color.setHex(primary);
    this.secondaryLight.color.setHex(secondary);
  }

  public addPointLight(color: number, intensity: number, distance: number = 20): THREE.PointLight {
    const light = new THREE.PointLight(color, intensity, distance);
    this.pointLights.push(light);
    this.group.add(light);
    return light;
  }

  public configureQuality(quality: QualityConfig) {
    this.primaryLight.castShadow = quality.shadows;
    if (quality.shadows) {
      this.primaryLight.shadow.mapSize.width = 1024;
      this.primaryLight.shadow.mapSize.height = 1024;
    }
  }

  public clearPointLights() {
    this.pointLights.forEach(light => {
      this.group.remove(light);
      light.dispose();
    });
    this.pointLights = [];
  }

  public dispose() {
    this.clearPointLights();
    this.ambientLight.dispose();
    this.primaryLight.dispose();
    this.secondaryLight.dispose();
  }
}
