<script>
  import { T, useThrelte, useFrame, watch } from '@threlte/core';
  import {
    BoxGeometry,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PlaneGeometry,
    SphereGeometry,
    Matrix4,
    Object3D,
    DynamicDrawUsage,
    Color,
    InstancedBufferAttribute,
    BufferGeometryLoader,
  } from 'three';
  import { InstancedMeshes } from '@threlte/extras';
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import { currentDate, humanGroup1, isMobile, renderFlag } from './stores';
  import Adult from './models/adult.svelte';
  import Child from './models/child.svelte';

  export let baseX = 0;
  export let baseY = 0;
  export let count = 2;
  export let array;

  $: if ($isMobile) {
    // throttle the frames-per-second to 30
    gsap.ticker.fps(30);
    gsap.ticker.lagSmoothing(1000, 16);
  }

  // compensate only when 1000ms or more elapses between 2 ticks,//and then make it act like only 16ms elapsed:
  // gsap.ticker.lagSmoothing(1000, 16);
  // gsap.ticker.lagSmoothing(0);

  // const timeline = gsap.timeline();

  const centers = {
    group1: { baseX: -8, baseY: -8 },
    group2: { baseX: 0, baseY: -8 },
    group3: { baseX: 8, baseY: -8 },
    group4: { baseX: -8, baseY: 8 },
    group5: { baseX: 0, baseY: 8 },
    group6: { baseX: 8, baseY: 8 },
  };

  let range = 0;
  const statusArray = [];

  const dummy = new Object3D();
  let instancedAdult, instancedChild;
  let adultGeo;

  const instancedMesh = {
    adult: [],
    child: [],
  };

  const baseColor = new Color('#fff');
  const adultColor = new Color('orangered');
  const childColor = new Color('cyan');

  const material = new MeshStandardMaterial({
    color: baseColor,
    roughness: 0.0,
    metalness: 0.0,
  });

  let current = 0;
  // const gridSize = Math.floor(Math.sqrt(count)) + 1;
  const matrices = new Float32Array(count * 16);
  const matricesChild = new Float32Array(count * 16);

  const baseAngle = (137.5 * Math.PI) / 180;

  function addInstance(index) {

    const dummy = new Object3D();

    // to set it in grid
    const iteration = current;
    dummy.scale.set(0, 0, 0);

    // phyllotaxy
    const r1 = Math.pow(iteration, 0.45) / 5;
    const r2 = Math.pow(iteration, 0.45) / 5.2;
    const angle = iteration * baseAngle;

    dummy.rotation.set(0, Math.random() * 2.0 * Math.PI, 0);
    dummy.position.set(
      centers[array[index].event].baseX + r2 * Math.cos(angle),
      array[index].type == 'adult' ? 0.5 : 0.25,
      centers[array[index].event].baseY + r2 * Math.sin(angle)
    );
    dummy.updateMatrix();

    instancedMesh[array[index].type].setMatrixAt(iteration, dummy.matrix);
    instancedMesh[array[index].type].setColorAt(iteration, baseColor);
    instancedMesh[array[index].type].instanceMatrix.needsUpdate = true;
    instancedMesh[array[index].type].instanceColor.needsUpdate = true;

    current++;
  }

  function reset() {
    statusArray.fill(0);
    highlight('adult', true);
    highlight('child', true);
    manipulateInstances();
    console.log('emptying the cluster');
  }

  function updateColor(instance, type, reset) {
    instancedMesh[type].setColorAt(
      instance,
      new Color().lerpColors(
        baseColor,
        reset ? baseColor : type === 'adult' ? adultColor : childColor,
        this.progress()
      )
    );
    instancedMesh[type].instanceColor.needsUpdate = true;
  }

  function highlight(type, reset = false) {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp[i] = { value: 0 };
      if (array[i].type === type) {
        gsap.to(temp[i], {
          value: 1,
          duration: 0.2,
          immediateRender: true,
          delay: 0.0002 * i,
          onUpdate: updateColor,
          onUpdateParams: [i, type, reset],
        });
      }
    }
  }

  onMount(() => {
    window.addEventListener('keydown', (e) => {
      if (e.key == 'r') {
        console.log('-----  instances reset -----');
        reset();
      } else if (e.key == 'a') {
        console.log('-----  highlighting adult -----');
        highlight('adult');
      } else if (e.key == 'c') {
        console.log('-----  highlighting child -----');
        highlight('child');
      }
    });

    function addInstances() {
      if (current < count) {
        for (let i = 0; i < count; i++) {
          addInstance(i);
        }

        statusArray.fill(0); // 1 -> visibile, 0 -> hidden
      }

      console.log('instances placed');
    }

    const setupInstanceInterval = setInterval(() => {
      if (array.length > 0) {
        addInstances();

        clearInterval(setupInstanceInterval);
      }
    }, 200);
  });

  function addToInstance2(dummy, type, i, dStatus) {
    dummy.updateMatrix();

    // const instancedMesh = type == 'adult' ? instancedAdult : instancedChild;
    instancedMesh[type].setMatrixAt(i, dummy.matrix);
    instancedMesh[type].instanceMatrix.needsUpdate = true;
    statusArray[i] = dStatus;
  }

  function manipulateInstances() {

    for (let i = 0; i < count; i++) {
      const dScale = i < range ? 1 : 0;
      const dStatus = dScale === 1 ? 1 : 0;

      if (statusArray[i] !== dStatus) {
        // there is a change in this instance
        // perform manipulation
        const dummy = new Object3D();
        const cType = array[i].type;
        const rndmOverflow = Math.random() * 0.05 - 0.025;
        const r1 = Math.pow(i, 0.3 + rndmOverflow) / 5;
        const r2 = Math.pow(i, 0.3 + rndmOverflow) / 5.2;
        const angle = i * baseAngle;

        dummy.scale.set(dScale, dScale, dScale);
        dummy.rotation.set(0, Math.random() * 2 * Math.PI, 0);

        gsap.fromTo(
          dummy.position,
          {
            x: centers[array[i].event].baseX + r1 * Math.cos(angle),
            y: cType == 'adult' ? 0.5 : 0.25,
            z: centers[array[i].event].baseY + r1 * Math.sin(angle),
          },
          {
            x: centers[array[i].event].baseX + r2 * Math.cos(angle),
            z: centers[array[i].event].baseY + r2 * Math.sin(angle),
            duration: dScale ? 0.3 : 0.1,
            ease: 'power4.out',
            onUpdate: addToInstance2,
            onUpdateParams: [dummy, cType, i, dStatus],
          }
        );
      }
    }
  }

  function checkDates() {
    const newRange = array.filter((x) => x.date <= $currentDate).length;

    if (newRange !== range) {
      range = newRange;
      manipulateInstances();
    }
  }

  $: if ($currentDate && array.length > 0) {
    // throttle(checkDates, 16);
    checkDates();
  }
</script>

{#if Adult && Child && material}
  <T.InstancedMesh {count} bind:ref="{instancedMesh.adult}">
    <!-- <T.BoxGeometry args="{[0.15, 1.0, 0.15]}" /> -->
    <!-- <T.SphereGeometry args="{[0.15, 2]}" /> -->
    <Adult />
    <T is="{material}" />

    <T.InstancedBufferAttribute
      attach="instanceMatrix"
      {count}
      array="{matrices}"
      itemSize="{16}"
      usage="{DynamicDrawUsage}"
      updateRange.count="{count}"
    />
  </T.InstancedMesh>

  <T.InstancedMesh {count} bind:ref="{instancedMesh.child}">
    <!-- <T.BoxGeometry args="{[0.15, 0.5, 0.15]}" /> -->

    <Child />
    <T is="{material}" />

    <T.InstancedBufferAttribute
      attach="instanceMatrix"
      {count}
      array="{matricesChild}"
      itemSize="{16}"
      usage="{DynamicDrawUsage}"
      updateRange.count="{count}"
    />
  </T.InstancedMesh>

  <T.Mesh rotation.x="{-Math.PI / 2}" position="{[baseX, -0.01, baseY]}">
    <T.CircleGeometry args="{[3, 8]}" />
    <T.MeshStandardMaterial
      color="#E8FBFF"
      side="{2}"
      roughness="{1.0}"
      metalness="{0.0}"
      envMapIntensity="{8.0}"
    />
  </T.Mesh>

  {#each Object.keys(centers) as center}
    <T.Mesh position="{[centers[center].baseX, 2, centers[center].baseY]}">
      <T.SphereGeometry args="{[0.15]}" />
      <T.MeshNormalMaterial />
    </T.Mesh>
  {/each}
{/if}
