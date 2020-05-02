export default function MentionCustomization(editor) {
    // The upcast converter will convert view <sapn class="user-mention mention" data-user-id="">
    // elements to the model 'mention' text attribute.
    editor.conversion.for('upcast').elementToAttribute({
        view: {
            name: 'span',
            key: 'data-mention',
            classes: 'mention user-mention',
            attributes: {
                'data-user-id': true
            }
        },
        model: {
            key: 'mention',
            value: viewItem => {
                // The mention feature expects that the mention attribute value
                // in the model is a plain object with a set of additional attributes.
                // In order to create a proper object use the toMentionAttribute() helper method:
                const mentionAttribute = editor.plugins.get('Mention').toMentionAttribute(viewItem, {
                    userId: viewItem.getAttribute('data-user-id')
                });

                return mentionAttribute;
            }
        },
        converterPriority: 'high'
    });

    // Downcast the model 'mention' text attribute to a view <a> element.
    editor.conversion.for('downcast').attributeToElement({
        model: 'mention',
        view: (modelAttributeValue, viewWriter) => {
            // Do not convert empty attributes (lack of value means no mention).
            if (!modelAttributeValue) {
                return;
            }

            return viewWriter.createAttributeElement('span', {
                class: 'mention user-mention',
                'data-mention': modelAttributeValue.id,
                'data-user-id': modelAttributeValue.userId,
            });
        },
        converterPriority: 'high'
    });
}