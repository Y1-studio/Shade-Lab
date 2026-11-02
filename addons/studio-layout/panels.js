// Dialog owners keep their drafts, validation and transactions. This package only
// changes presentation and always restores relocated nodes during cleanup.
const ContextPanels = (() => {
  let controller=null;
  return {
    connect(value){controller=value;},
    open(dialog){if(controller)controller.openDialog(dialog);else dialog.showModal();},
    close(dialog){return controller?.closeDialog(dialog)||false;}
  };
})();
