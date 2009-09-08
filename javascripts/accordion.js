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
var Accordion = Class.create({
  
  initialize: function(id, options){
    this.id = id;
    this.root = $(id);
    if (!this.root) return false;
    this.options = Object.extend({
      cancelEvent: true,
      classNames: { section: 'section', title: 'title', toggle: 'toggle', expanded: 'expanded' },
      mutuallyExclusive: true,
      effectDuration: .3,
      disabled: false
    }, options || {});
    if (this.options.disabled) this.disable();
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
    var el = e.element();
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
  
  fireEvent: function(state){
    document.fire(this.id + ':' + state, { accordion: this });
  },
  
  disable: function(){
    this.disabled = true;
    this.root.addClassName('disabled');
    this.fireEvent('disabled');
  },
  
  enable: function(){
    this.disabled = false;
    this.root.removeClassName('disabled');
    this.fireEvent('enabled');
  },
  
  toggleDisabled: function(){
    if (this.disabled) this.enable();
    else this.disable();
  }
  
});

var AccordionSection = Class.create({
  
  initialize: function(i, accordion){
    this.index = i;
    this.accordion = accordion;
    this.classNames = accordion.options.classNames;
    this.elements = {
      section: accordion.elements.sections[i],
      title:   accordion.elements.titles[i],
      toggle:  accordion.elements.toggles[i]
    };
    this.disabled = false;
    this.elements.toggle.setStyle({ height: this.elements.toggle.getHeight() + 'px' }).hide();
    this.visible = false;
  },
  
  setHidden: function(){
    if (this.elements.section.hasClassName(this.classNames.expanded))
      this.elements.section.removeClassName(this.classNames.expanded);
    this.visible = false;
    this.fireEvent('hidden');
  },
  
  setVisible: function(){
    this.elements.section.addClassName(this.classNames.expanded);
    this.visible = true;
    this.accordion.activeSection = this;
    this.fireEvent('shown');
  },
  
  fireEvent: function(state){
    document.fire(this.accordion.id + 'Section:' + state, { accordion: this.accordion, section: this });
  },
  
  disable: function(){
    this.disabled = true;
    this.elements.section.addClassName('disabled');
    this.fireEvent('disabled');
  },
  
  enable: function(){
    this.disabled = false;
    this.elements.section.removeClassName('disabled');
    this.fireEvent('enabled');
  },
  
  toggleDisabled: function(){
    if (this.disabled) this.enable();
    else this.disable();
  }
  
});
