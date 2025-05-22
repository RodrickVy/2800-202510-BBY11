class FieldsetListController {
    constructor(sectionId, defaultList = []) {
        this.section = document.getElementById(sectionId);
        this.data = [];

        if (!this.section) {
            throw new Error(`Section with ID "${sectionId}" not found.`);
        }

        this.template = this.section.querySelector('fieldset');
        if (!this.template) {
            throw new Error(`No <fieldset> found inside section "${sectionId}"`);
        }

        this.template.remove(); // Remove template to start fresh
        this._renderFromList(defaultList);
    }

    _renderFromList(list) {
        list.forEach((item, index) => this._createFieldset(item, index));
        this._updateData();
    }

    _createFieldset(item, index) {
        const fieldset = this.template.cloneNode(true);

        fieldset.querySelectorAll('input, textarea, select').forEach((input) => {
            const name = input.getAttribute('name');
            if (!name) return;

            const newId = `${name}_${index}`;
            input.id = newId;
            input.name = name;

            // Populate with default value
            input.value = item[name] || '';

            input.addEventListener('input', () => this._updateData());
        });

        const removeBtn = fieldset.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.onclick = () => this.removeFieldset(fieldset);
        }

        this.section.appendChild(fieldset);
    }

    _updateData() {
        this.data = Array.from(this.section.querySelectorAll('fieldset')).map((fs) => {
            const obj = {};
            fs.querySelectorAll('input, textarea, select').forEach((input) => {
                const name = input.getAttribute('name');
                if (name) {
                    obj[name] = input.value;
                }
            });
            return obj;
        });
    }

    addFieldset() {
        const index = this.section.querySelectorAll('fieldset').length;
        this._createFieldset({}, index);
        this._updateData();
    }

    removeFieldset(fieldset) {
        const total = this.section.querySelectorAll('fieldset').length;
        if (total <= 1) return;
        this.section.removeChild(fieldset);
        this._updateData();
    }

    getData() {
        return this.data;
    }
}
