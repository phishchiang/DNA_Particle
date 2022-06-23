import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertexParticles.glsl";
import * as dat from "dat.gui";
import gsap from "gsap";

import dna_model from "../dna.glb";
import { Blending } from "three";


export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x111111, 1); 
    this.renderer.physicallyCorrectLights = true;
    // this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderConfig({ type: 'js' });
    this.dracoLoader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'); // use a full url path
    this.loader.setDRACOLoader(this.dracoLoader);

    this.count = 0;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );

    this.loader.load(dna_model, (gltf) => {
      this.geometry = gltf.scene.children[0].geometry;
      this.geometry.center();

      this.settings();
      this.addObjects();
      this.initpost();
      this.resize();
      this.setupResize();
      this.render();
    })

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;


  }

  initpost() {
    this.renderScene = new RenderPass( this.scene, this.camera );

    this.bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.9, 0.85 );



    this.composer = new EffectComposer( this.renderer );
    this.composer.addPass( this.renderScene );
    this.composer.addPass( this.bloomPass );
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0.6,
      bloomThreshold: 0.08,
      bloomStrength: 0.9,
      bloomRadius: 0.85,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 6, 0.01);
    this.gui.add(this.settings, "bloomThreshold", 0.01, 1.5, 0.01);
    this.gui.add(this.settings, "bloomStrength", 0, 15, 0.01);
    this.gui.add(this.settings, "bloomRadius", 0, 3, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    

    // image cover
    this.imageAspect = 1;
    let a1; let a2;
    if(this.height/this.width>this.imageAspect) {
      a1 = (this.width/this.height) * this.imageAspect ;
      a2 = 1;
    } else{
      a1 = 1;
      a2 = (this.height/this.width) / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;


    this.camera.updateProjectionMatrix();


  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        uColor1: { value: new THREE.Color(0x612574) },
        uColor2: { value: new THREE.Color(0x293583) },
        uColor3: { value: new THREE.Color(0x1954ec) },
        progress: { value: 0.6 },
        resolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      depthTest: false,
      depthWrite: false,
      transparent: true,

      vertexShader: vertex,
      fragmentShader: fragment,
      blending: THREE.AdditiveBlending
    });

    this.particle_num = this.geometry.attributes.position.count;
    let a_random_size = new Float32Array(this.particle_num);
    let a_random_color = new Float32Array(this.particle_num);
    
    for (let i = 0; i < this.particle_num; i++) {
      a_random_size[i] = Math.random();
      a_random_color[i] = Math.random();
      
    }
    this.geometry.setAttribute('a_random_size', new THREE.BufferAttribute(a_random_size, 1));
    this.geometry.setAttribute('a_random_color', new THREE.BufferAttribute(a_random_color, 1));
    
    // this.geometry = new THREE.PlaneGeometry(1, 1, 10, 10);
    
    this.mesh = new THREE.Points(this.geometry,this.material)
    this.scene.add(this.mesh)
    
    console.log(this.mesh);

  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;

    this.mesh.rotation.y = -this.time/20;

    this.bloomPass.threshold = this.settings.bloomThreshold;
    this.bloomPass.strength = this.settings.bloomStrength;
    this.bloomPass.radius = this.settings.bloomRadius;

    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();

  }
}

new Sketch({
  dom: document.getElementById("container")
});
