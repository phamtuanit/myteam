<template>
    <div class="iframe-wrapper">
        <iframe :src="src" class="iframe" frameborder="0"></iframe>
    </div>
</template>

<script>
export default {
    name: "Frame",
    props: ['src'],
    data() {
        return {};
    },
};
</script>

<style>
.iframe-wrapper,
.iframe {
    height: 100%;
    width: 100%;
}
</style>
