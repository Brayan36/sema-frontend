import L from 'leaflet';
import 'leaflet-draw';

export function traducirDibujo() {
  const local = L.drawLocal;
  local.draw.toolbar.actions = { title: 'Cancelar dibujo', text: 'Cancelar' };
  local.draw.toolbar.finish = { title: 'Terminar dibujo', text: 'Terminar' };
  local.draw.toolbar.undo = { title: 'Eliminar último punto', text: 'Deshacer punto' };
  local.draw.toolbar.buttons.polygon = 'Dibujar terreno';
  local.draw.handlers.polygon.tooltip = { start: 'Haz clic para empezar el terreno.', cont: 'Haz clic para añadir un vértice.', end: 'Haz clic en el primer vértice para cerrar.' };
  local.draw.handlers.polyline.error = 'Los lados del terreno no pueden cruzarse.';
  local.edit.toolbar.buttons = { edit: 'Editar terreno', editDisabled: 'Dibuja un terreno para editarlo', remove: 'Eliminar terreno', removeDisabled: 'No hay terreno para eliminar' };
  local.edit.toolbar.actions.save = { title: 'Guardar cambios', text: 'Guardar' };
  local.edit.toolbar.actions.cancel = { title: 'Descartar cambios', text: 'Cancelar' };
  local.edit.toolbar.actions.clearAll = { title: 'Eliminar todos los terrenos', text: 'Eliminar todo' };
  local.edit.handlers.edit.tooltip = { text: 'Arrastra los vértices para editar.', subtext: 'Pulsa Cancelar para descartar los cambios.' };
  local.edit.handlers.remove.tooltip.text = 'Haz clic en el terreno para eliminarlo y pulsa Guardar.';
}
