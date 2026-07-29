<template>
  <div class="custom-html" v-if="html" v-html="html"></div>
</template>

<script setup>
defineProps({
  html: { type: String, default: '' }
})
</script>
```

Update Home.vue to include it.<｜end▁of▁thinking｜>```vue
<style scoped>
.custom-html {
  width: 100%;
}
</style>
