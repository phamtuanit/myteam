// Ref: https://ckeditor.com/docs/ckeditor5/latest/framework/guides/creating-simple-plugin.html
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

class InsertImage extends Plugin {
    init() {
        console.log('Chat-plugin was initialized');
    }
}

export default InsertImage;