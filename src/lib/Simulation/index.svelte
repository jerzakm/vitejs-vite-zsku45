<script>
  import { Canvas } from '@threlte/core';
  import { Sky } from '@threlte/extras';
  import Scene from './scene.svelte';
  import { currentDate, isMobile, renderFlag } from './stores';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import moment from 'moment';

  export let embedded = false;

  const yearStart = new Date(2022, 0, 1);
  let progress = 0;

  onMount(() => {
    const tempDate = $currentDate;
    if (window.innerWidth < 540) {
      $isMobile = true;
    }

    const placeholder = document.querySelector('#placeholder');
    const placeholderHeight =
      placeholder.getBoundingClientRect().height - window.innerHeight;

    function scrollDate() {
      const placeholderRect = placeholder.getBoundingClientRect();

      if (
        placeholderRect.top < 0 &&
        placeholderRect.bottom > window.innerHeight
      ) {
        progress = -placeholderRect.top / placeholderHeight;
        $renderFlag = true;
      } else if (placeholderRect.top > 0) {
        progress = 0;
        $renderFlag = false;
      } else if (
        placeholderRect.top < 0 &&
        placeholderRect.bottom < window.innerHeight
      ) {
        progress = 1;
        $renderFlag = false;
      }

      const tempDate = moment([2022, 0, 1]).add(
        Math.floor(progress * 365 * 2),
        'd'
      );
      $currentDate = new Date(tempDate);
    }

    if ($isMobile) {
      window.addEventListener('scroll', throttle(scrollDate, 30), false);
    } else {
      window.addEventListener('scroll', scrollDate, false);
    }
  });
</script>

<div id="placeholder">
  <div id="canvas-container">
    <ul class="font-sans text-sm leading-tighter">
      <li>'r' to reset</li>
      <li>'a' to highlight adults</li>
      <li>'c' to highlight children</li>
    </ul>
    <Canvas frameloop="demand">
      <Scene />
    </Canvas>
  </div>
</div>

<style>
  #placeholder {
    position: relative;
    height: 1600vh;
    width: 100vw;
    background-color: #f0fcff;
    /* background-color: red; */
  }

  #canvas-container > ul {
    position: sticky;
    top: 0%;
    left: 2%;
    height: 0;
  }

  #canvas-container {
    position: sticky;
    top: 0;
    height: 100vh;
    max-height: 100vh;
  }
</style>
