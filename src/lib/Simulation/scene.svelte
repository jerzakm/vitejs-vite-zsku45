<script lang="ts">
  import { T, useLoader, watch, useThrelte, useRender } from "@threlte/core";
  import {
    OrbitControls,
    Environment,
    ContactShadows,
    Text,
  } from "@threlte/extras";
  import Cluster from "./cluster.svelte";
  import { onMount } from "svelte";
  import { currentDate, isMobile, renderFlag, clusterData } from "./stores";

  const group1Count = 200;
  const group2Count = 500;
  const group3Count = 2000;
  const clusterCount = 45000;

  function generateRandomDate(from, to) {
    return new Date(
      from.getTime() + Math.random() * (to.getTime() - from.getTime())
    );
  }

  const { frameloop, renderer, scene, camera } = useThrelte();

  onMount(() => {
    const eventsArr = [
      "group1",
      "group2",
      "group3",
      "group4",
      "group5",
      "group6",
    ];

    for (let i = 0; i < clusterCount; i++) {
      $clusterData[i] = {
        type: Math.random() < 0.5 ? "adult" : "child",
        date: generateRandomDate(new Date(2022, 0, 1), new Date()),
        event: eventsArr[Math.floor(Math.random() * eventsArr.length)],
      };
    }

    console.log("array filled!");
  });

  watch(renderFlag, (flag) => {
    if (flag) {
      // clock.start();
      frameloop.current = "demand";
    } else {
      // clock.stop();
      frameloop.current = "never";
    }
  });

  import { ThreePerf } from "three-perf";
  const perf = new ThreePerf({
    anchorX: "left",
    anchorY: "top",
    domElement: document.body, // or other canvas rendering wrapper
    renderer: renderer, // three js renderer instance you use for rendering
  });
  useRender(() => {
    perf.begin();
    renderer.render(scene, $camera);
    perf.end();
  });

  import { InstancedUniformsMesh } from "three-instanced-uniforms-mesh";
  import Adult from "./models/adult.svelte";
  import {
    MeshStandardMaterial,
    type BufferGeometry,
    Matrix4,
    Vector3,
  } from "three";
  import Child from "./models/child.svelte";

  let childGeo: BufferGeometry;
  let adultGeo: BufferGeometry;

  const w = 100;
  const h = 100;

  let childInstancedMesh: InstancedUniformsMesh<MeshStandardMaterial>;
  $: {
    if (childGeo) {
      childInstancedMesh = new InstancedUniformsMesh(
        childGeo,
        new MeshStandardMaterial(),
        w * h
      );

      const mat4 = new Matrix4();
      const vec3 = new Vector3();

      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
          vec3.set(x * 0.5 - w / 4, 0, y * 0.5 - h / 4);
          mat4.setPosition(vec3);
          const i = x * h + y;
          childInstancedMesh.setMatrixAt(i, mat4);
        }
      }
    }
  }

  let adultInstancedMesh: InstancedUniformsMesh<MeshStandardMaterial>;
  $: {
    if (adultGeo) {
      adultInstancedMesh = new InstancedUniformsMesh(
        adultGeo,
        new MeshStandardMaterial(),
        w * h
      );

      const mat4 = new Matrix4();
      const vec3 = new Vector3();

      for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
          vec3.set(x * 0.5 + 0.25 - w / 4, 0, y * 0.5 - h / 4 + 0.1);
          mat4.setPosition(vec3);
          const i = x * h + y;
          adultInstancedMesh.setMatrixAt(i, mat4);
        }
      }
    }
  }
</script>

<Adult bind:ref={adultGeo} />
<Child bind:ref={childGeo} />

{#if childInstancedMesh}
  <T is={childInstancedMesh} />
{/if}

{#if adultInstancedMesh}
  <T is={adultInstancedMesh} />
{/if}

<!-- <Cluster count={clusterCount} array={$clusterData} /> -->

<T.DirectionalLight
  position.y={10}
  position.z={5}
  intensity={1}
  color="white"
  shadow.camera.left={-5.5}
  shadow.camera.right={5.5}
  shadow.camera.top={5.5}
  shadow.camera.bottom={-5.5}
  shadow.mapSize.width={$isMobile ? 256 : 1024}
  shadow.mapSize.height={$isMobile ? 256 : 1024} />

<T.PerspectiveCamera
  position={[0, 15, 30]}
  makeDefault
  fov={20}
  on:create={({ ref }) => {
    ref.lookAt(0, 1, 0);
  }}>
  <OrbitControls
    autoRotate={true}
    autoRotateSpeed={0.1}
    enableDamping={true}
    enableZoom={false}
    enablePan={false} />
</T.PerspectiveCamera>

<!-- <Environment
  path="{`${assets}/images/`}"
  files="cubemap.png"
  isBackground="{false}"
/> -->

<Text
  text={$currentDate.toDateString()}
  color="red"
  fontSize={1}
  anchorX="50%"
  anchorY="200%" />

<!-- <T.Mesh>
  <T.BoxGeometry args={1} />
  <T.MeshNormalMaterial />
</T.Mesh> -->
