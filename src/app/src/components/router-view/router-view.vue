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

<style >
.keep-alive-view > div[data-active="false"] {
    display: none !important;
}
</style>