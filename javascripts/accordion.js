/*

Assumes that it will run on dom:loaded

Example Markup structure:
  <ul id="accordion">
    <li class="section">
      <a href="#1" class="title">My Section Title</a>
      <div class="toggle">Stuff to be shown when expanded.</div>
    </li>
    <!-- repeat as many as needed -->
  </ul>

*/
var CanBeDisabledAndFireEvents = Class.create({
  initialize: function (name, element, disabled) {
    this.disabled = disabled || false;
    this.elementToBeDisabled = element;
    this.name = name;
    if (this.disabled) this.disable();
  },
  disable: function () {
    this.disabled = true;
    this.elementToBeDisabled.addClassName('disabled');
    this.fireEvent('disabled', { el: this.elementToBeDisabled });
  },
  enable: function() {
    this.disabled = false;
    this.elementToBeDisabled.removeClassName('disabled');
    this.fireEvent('enabled', { el: this.elementToBeDisabled });
  },
  toggleDisabled: function(){
    if (this.disabled) this.enable();
    else this.disable();
  },
  fireEvent: function (state, memo) {
    // console.log(this.name + ':' + state, memo);
    document.fire(this.name + ':' + state, memo);
  }
});



var Accordion = Class.create(CanBeDisabledAndFireEvents, {
  initialize: function($super, id, options){
    this.id = id;
    this.root = $(id);
    if (!this.root) return false;
    this.options = Object.extend({
      cancelEvent: true,
      classNames: { section: 'section', title: 'title', toggle: 'toggle', expanded: 'expanded' },
      mutuallyExclusive: true,
      effectDuration: .3,
      disabled: false,
      startHidden: true
    }, options || {});
    
    $super(id, this.root, this.options.disabled);
    
    this.accordionEffectOptions = $H({
      duration: this.options.effectDuration,
      queue: { position: 'end', limit: 1, scope: id }
    });
    this.elements = {
      sections: $$('#' + id + ' .' + this.options.classNames.section),
      titles:   $$('#' + id + ' .' + this.options.classNames.title),
      toggles:  $$('#' + id + ' .' + this.options.classNames.toggle)
    };
    this.activeSection = false;
    this.setupAccordionSections();
    this.fireEvent('initialized');
  },
  setupAccordionSections: function(){
    this.sections = [];
    for (var i=0; i < this.elements.sections.length; i++) {
      this.sections.push(new AccordionSection(i, this));
    };
    
    this.root.observe('click', this.rootObserver.bind(this));
  },
  rootObserver: function(e){
    var el = e.findElement();
    if (el.up('.' + this.options.classNames.title)) el = el.up('.' + this.options.classNames.title);
    
    if (el.match('.' + this.options.classNames.title)) {
      
      if (!this.disabled) this.fireEvent('clicked');
      
      if (this.options.cancelEvent) e.stop();
      
      el.blur();
      
      if (this.disabled) return;
      
      var comingSection = this.sections.find(function(section){
        return !section.visible && section.elements.title == el;
      });
      var goingSection = this.sections.find(function(section){
        return section.visible;
      });
      
      if (comingSection && goingSection && this.options.mutuallyExclusive){
        this.showAnotherSection(comingSection, goingSection);
      } else {
        if (comingSection) this.showSection(comingSection);
        else {
          for (var i = this.sections.length - 1; i >= 0; i--){
            if (this.sections[i].elements.title == el) goingSection = this.sections[i];
          };
          this.hideSection(goingSection);
        }
      } 
    }
  },
  showAnotherSection: function(comingSection, goingSection){
    if (comingSection.disabled || goingSection.disabled) return;
    new Effect.Parallel([
      new Effect.BlindDown(comingSection.elements.toggle, { sync: true }),
      new Effect.BlindUp(goingSection.elements.toggle, { sync: true })
    ],
    this.accordionEffectOptions.merge({
      afterFinish: function(){
        goingSection.setHidden();
        comingSection.setVisible();
      }
    }).toObject());
  },
  hideSection: function(goingSection){
    if (goingSection.disabled) return;
    goingSection.elements.toggle.blindUp(
      this.accordionEffectOptions.merge({
        afterFinish: goingSection.setHidden.bind(goingSection)
      }).toObject()
    );
  },
  showSection: function(comingSection){
    if (comingSection.disabled) return;
    comingSection.elements.toggle.blindDown(
      this.accordionEffectOptions.merge({
        afterFinish: comingSection.setVisible.bind(comingSection)
      }).toObject()
    );
  },
  fireEvent: function($super, state){
    $super(state, { accordion: this });
  }
});

var AccordionSection = Class.create(CanBeDisabledAndFireEvents, {
  initialize: function($super, i, accordion){
    this.index = i;
    this.accordion = accordion;
    this.elements = {
      section: accordion.elements.sections[i],
      title:   accordion.elements.titles[i],
      toggle:  accordion.elements.toggles[i]
    };
    this.visible = true;
    $super(this.accordion.id + 'Section', this.elements.section);
    if (this.accordion.options.startHidden){
      this.elements.toggle.hide();
      this.setHidden();
    }
  },
  setHidden: function(){
    this.elements.section.removeClassName(this.accordion.options.classNames.expanded);
    this.visible = false;
    this.fireEvent('hidden');
  },
  setVisible: function(){
    this.elements.section.addClassName(this.accordion.options.classNames.expanded);
    this.visible = true;
    this.accordion.activeSection = this;
    this.fireEvent('shown');
  },
  fireEvent: function($super, state){
    $super(state, { accordion: this.accordion, section: this });
  }
});
