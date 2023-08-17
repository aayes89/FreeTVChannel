
    document.addEventListener('DOMContentLoaded', function() {
      // Fetch canales y mostrarlos
      fetch('/channels')
        .then(response => response.json())
        .then(canales => {
          const listaCanales = document.getElementById('channelsList');
          canales.forEach(canal => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
              ${canal.name} - ${canal.description} - ${canal.url}
              <div>
                <button class="btn btn-info mr-2 edit-icon" data-id="${canal.id}" data-toggle="modal" data-target="#editChannelModal">
                  <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="btn btn-danger delete-icon" data-id="${canal.id}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            `;
            listaCanales.appendChild(li);
          });
        });

      const addChannelForm = document.getElementById('addChannelForm');
      const addChannelButton = document.getElementById('addChannelButton'); // Botón para mostrar/ocultar el formulario
      const channelNameInput = document.getElementById('name');
      const channelDescriptionInput = document.getElementById('description');
      const channelUrlInput = document.getElementById('url');
      const channelIconInput = document.getElementById('icon');

      // Ocultar el formulario al cargar la página
      addChannelForm.style.display = 'none';

      // Mostrar/ocultar el formulario al hacer clic en el botón
      addChannelButton.addEventListener('click', function() {
        if (addChannelForm.style.display === 'none') {
          addChannelForm.style.display = 'block';
          channelNameInput.focus(); // Enfocar el primer campo
        } else {
          addChannelForm.style.display = 'none';
          addChannelForm.reset(); // Limpiar campos
        }
      });

      addChannelForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(addChannelForm);
        const canalData = {
          name: formData.get('name'),
          description: formData.get('description'),
          url: formData.get('url'),
          icon: formData.get('icon')
        };

        fetch('/addChannel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(canalData)
        })
        .then(response => response.json())
        .then(result => {
          console.log(result);
          window.location.reload(); // Refrescar la página para mostrar la lista actualizada
        })
        .catch(error => console.error('Error al agregar el canal:', error));
      });

      // Manejar clic en el ícono de editar
      document.addEventListener('click', event => {
        if (event.target.classList.contains('edit-icon')) {
          const channelId = event.target.getAttribute('data-id');

          // Obtener detalles del canal por su ID
          fetch(`/channel?id=${channelId}`)
            .then(response => response.json())
            .then(channel => {
              const editModal = document.getElementById('editChannelModal');
              const editNameInput = document.getElementById('editName');
              const editDescriptionInput = document.getElementById('editDescription');
              const editUrlInput = document.getElementById('editUrl');
              const editIconInput = document.getElementById('editIcon');

              // Llenar campos del modal de edición con los detalles del canal
              editNameInput.value = channel.name;
              editDescriptionInput.value = channel.description;
              editUrlInput.value = channel.url;
              editIconInput.value = channel.icon;

              // Guardar los cambios
              const saveEditButton = document.getElementById('saveEditButton');
              saveEditButton.addEventListener('click', () => {
                const editedChannelData = {
                  name: editNameInput.value,
                  description: editDescriptionInput.value,
                  url: editUrlInput.value,
                  icon: editIconInput.value
                };

                fetch(`/editChannel/${channelId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(editedChannelData)
                })
                .then(response => response.json())
                .then(result => {
                  console.log(result);
                  window.location.reload(); // Refrescar la página para mostrar la lista actualizada
                })
                .catch(error => console.error('Error al editar el canal:', error));
              });

              // Mostrar el modal de edición
              $(editModal).modal('show');
            })
            .catch(error => console.error('Error al obtener detalles del canal:', error));
        }
      });

      // Manejar clic en el ícono de eliminar
      document.addEventListener('click', event => {
        if (event.target.classList.contains('delete-icon')) {
          const channelId = event.target.getAttribute('data-id');
          if (confirm('¿Estás seguro de que deseas eliminar este canal?')) {
            fetch(`/deleteChannel/${channelId}`, {
              method: 'DELETE'
            })
            .then(response => response.json())
            .then(result => {
              console.log(result);
              window.location.reload(); // Refrescar la página para mostrar la lista actualizada
            })
            .catch(error => console.error('Error al eliminar el canal:', error));
          }
        }
      });
    });
