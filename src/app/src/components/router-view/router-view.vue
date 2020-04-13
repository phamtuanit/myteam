<template>
    <div class="fill-height fill-width keep-alive-view">
        <slot></slot>
    </div>
</template>

<script>
export default {
    name: "KeepAliveView",
};
</script>

<style scoped>
.keep-alive-view >>> .hidden {
    display: none !important;
}
</style>