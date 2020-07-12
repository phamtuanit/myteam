<template>
    <div id="extension-content">
        <router-view :key="$route.name"></router-view>
    </div>
</template>

<script>
export default {
    name: "Extensions"
};
</script>

<style>
#extension-content {
    height: 100%;
    width: 100%;
}
</style>
