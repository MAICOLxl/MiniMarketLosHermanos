// Clase que maneja el inventario del minimarket
class Inventario {
    // constructor carga nuestro inventario guardado
    constructor(storageKey = 'minimarketInventario') {
        this.storageKey = storageKey;      // clave en localStorage
        this.productos = {};              // objeto de productos por id
        this.cargar();                    // cargar datos si existen
    }

    // inventario local
    cargar() {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                if (data && typeof data === 'object') {
                    this.productos = data;
                }
            } catch (error) {
                console.error('Error cargando inventario:', error);
                this.productos = {};
            }
        }
    }

    // guardar de manera local
    guardar() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.productos));
    }

    // obtiene los productos del vector por id
    getProductos() {
        return Object.values(this.productos).sort((a, b) => a.id - b.id);
    }

    // obtiene el producto por id, devuelve null si no hay y/o existe
    getProducto(id) {
        return this.productos[id] || null;
    }

    // busca nombre del producto. nota: arreglar la sensibilidad a mayusculas y tildes
    getProductoPorNombre(nombre) {
        const nombreNormalizado = nombre.trim().toLowerCase();
        return Object.values(this.productos).find(
            p => p.nombre.trim().toLowerCase() === nombreNormalizado
        ) || null;
    }

    // devuelve el stock actual
    getStockPorNombre(nombre) {
        const p = this.getProductoPorNombre(nombre);
        return p ? p.cantidad : null;
    }

    // crear id de forma dinamica. aumenta en 1
    generarId() {
        const ids = Object.keys(this.productos).map(Number);
        if (ids.length === 0) return 1;
        return Math.max(...ids) + 1;
    }

    // agregar producto en inventario si no existe, si existe actualizar stock y precio.
    agregarProducto({ nombre, precio, cantidad }) {
        // validar datos básicos
        if (!nombre || precio == null || cantidad == null) {
            return false;
        }

        nombre = nombre.trim();
        precio = Number(precio);
        cantidad = Number(cantidad);

        if (!nombre || precio < 0 || cantidad < 0) {
            return false;
        }

        // si producto existente, sumar stock y actualizar precio
        const existente = this.getProductoPorNombre(nombre);
        if (existente) {
            existente.cantidad += cantidad;
            existente.precio = precio;
            this.mostrarMensaje(`Producto '${nombre}' actualizado (nuevo stock: ${existente.cantidad}).`);
        } else {
            const nuevoId = this.generarId();
            this.productos[nuevoId] = {
                id: nuevoId,
                nombre: nombre,
                precio: precio,
                cantidad: cantidad
            };
            this.mostrarMensaje(`Producto '${nombre}' agregado al inventario con id ${nuevoId}.`);
        }

        // persistir datos
        this.guardar();
        return true;
    }

    // elimina producto por id
    eliminarProducto(id) {
        id = Number(id);
        if (!this.productos[id]) return false;

        delete this.productos[id];
        this.guardar();
        this.mostrarMensaje(`Producto id ${id} eliminado.`);
        return true;
    }

    // cambiar disponibilidad de un producto por id
    ajustarStock(id, delta) {
        const prod = this.getProducto(id);
        if (!prod) return false;

        const nuevoStock = prod.cantidad + Number(delta);
        if (nuevoStock < 0) {
            return false; // no permitir stock negativo
        }

        prod.cantidad = nuevoStock;
        this.guardar();
        return true;
    }

    // vender porudcot por id
    venderProducto(id, cantidad = 1) {
        if (cantidad <= 0) return false;
        return this.ajustarStock(id, -cantidad);
    }

    // funcion para retirar producto por el colaborador del negocio
    retirarProducto(id, cantidad = 1) {
        if (cantidad <= 0) return false;
        return this.ajustarStock(id, -cantidad);
    }

    // reponer stock
    reponerProducto(id, cantidad = 1) {
        if (cantidad <= 0) return false;
        return this.ajustarStock(id, cantidad);
    }

    // ventas por nombre del producto, para facilitar la integración con el carrito de compras
    venderProductoPorNombre(nombre, cantidad = 1) {
        const prod = this.getProductoPorNombre(nombre);
        if (!prod) return false;
        return this.venderProducto(prod.id, cantidad);
    }

    // Muestra tabla HTML del inventario en pantalla
    renderTablaInventario() {
        const contenedor = document.getElementById('inventario-container');
        if (!contenedor) return;

        const term = document.getElementById('input-buscar-inventario');
        const filtro = term ? term.value.trim().toLowerCase() : '';

        // aplicar filtro de búsqueda
        const productos = this.getProductos().filter(p => {
            if (!filtro) return true;
            return p.nombre.toLowerCase().includes(filtro) || String(p.id).includes(filtro);
        });

        if (productos.length === 0) {
            contenedor.innerHTML = '<p>No hay productos en inventario.</p>';
            if (typeof actualizarStockEnTarjetas === 'function') actualizarStockEnTarjetas();
            return;
        }

        // construye tabla de inventario
        let html = '<table style="width:100%;border-collapse:collapse;"><thead><tr>' +
            '<th style="border:1px solid #ddd;padding:8px;text-align:left;">ID</th>' +
            '<th style="border:1px solid #ddd;padding:8px;text-align:left;">Nombre</th>' +
            '<th style="border:1px solid #ddd;padding:8px;text-align:right;">Precio</th>' +
            '<th style="border:1px solid #ddd;padding:8px;text-align:right;">Cantidad</th>' +
            '<th style="border:1px solid #ddd;padding:8px;text-align:center;">Acciones</th>' +
            '</tr></thead><tbody>';

        productos.forEach((prod) => {
            html += `<tr` + (prod.cantidad === 0 ? ' style="background:#f8d7da;"' : '') + `>`;
            html += `<td style="border:1px solid #ddd;padding:8px;">${prod.id}</td>`;
            html += `<td style="border:1px solid #ddd;padding:8px;">${prod.nombre}</td>`;
            html += `<td style="border:1px solid #ddd;padding:8px;text-align:right;">RD$${prod.precio.toFixed(2)}</td>`;
            html += `<td style="border:1px solid #ddd;padding:8px;text-align:right;">${prod.cantidad}</td>`;
            html += `<td style="border:1px solid #ddd;padding:8px;text-align:center;">
                <button data-id="${prod.id}" data-accion="vender" style="margin-right:4px;">Vender 1</button>
                <button data-id="${prod.id}" data-accion="retirar" style="margin-right:4px;">Retirar</button>
                <button data-id="${prod.id}" data-accion="reponer" style="margin-right:4px;">Reponer</button>
                <button data-id="${prod.id}" data-accion="eliminar" style="background:#dc3545;color:white;">Eliminar</button>
            </td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        contenedor.innerHTML = html;

        // agrega eventos a botones de acción por fila
        contenedor.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(btn.dataset.id);
                const accion = btn.dataset.accion;
                if (accion === 'vender') {
                    if (!this.venderProducto(id, 1)) {
                        this.mostrarMensaje('No hay stock suficiente para vender.', 'error');
                        return;
                    }
                    this.mostrarMensaje(`Venta registrada: producto id ${id} (-1).`);
                } else if (accion === 'retirar') {
                    let cantidad = prompt('¿Cuántas unidades retiras? (empleado/propietario)', '1');
                    cantidad = parseInt(cantidad, 10);
                    if (isNaN(cantidad) || cantidad <= 0) return;
                    if (!this.retirarProducto(id, cantidad)) {
                        this.mostrarMensaje('Stock insuficiente para retirar esa cantidad.', 'error');
                        return;
                    }
                    this.mostrarMensaje(`Stock reducido en ${cantidad} de id ${id}.`);
                } else if (accion === 'reponer') {
                    let cantidad = prompt('¿Cuántas unidades añades al inventario?', '1');
                    cantidad = parseInt(cantidad, 10);
                    if (isNaN(cantidad) || cantidad <= 0) return;
                    this.reponerProducto(id, cantidad);
                    this.mostrarMensaje(`Stock repuesto en ${cantidad} de id ${id}.`);
                } else if (accion === 'eliminar') {
                    if (confirm('¿Eliminar este producto del inventario?')) {
                        this.eliminarProducto(id);
                    } else {
                        return;
                    }
                }

                this.renderTablaInventario();
                if (typeof actualizarStockEnTarjetas === 'function') actualizarStockEnTarjetas();
            });
        });

        if (typeof actualizarStockEnTarjetas === 'function') actualizarStockEnTarjetas();
    }

    // Mensajes de estado para el administrador
    mostrarMensaje(mensaje, tipo = 'ok') {
        const cont = document.getElementById('inventario-mensaje');
        if (!cont) return;

        cont.innerText = mensaje;
        cont.style.display = 'block';

        if (tipo === 'error') {
            cont.style.backgroundColor = '#f8d7da';
            cont.style.color = '#721c24';
            cont.style.borderColor = '#f5c6cb';
        } else {
            cont.style.backgroundColor = '#d4edda';
            cont.style.color = '#155724';
            cont.style.borderColor = '#c3e6cb';
        }

        setTimeout(() => { cont.style.display = 'none'; }, 2200);
    }

    // Inicializa eventos del formulario y actualiza la tabla
    inicializarUI() {
        const form = document.getElementById('form-agregar-producto');
        const buscador = document.getElementById('input-buscar-inventario');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const nombre = document.getElementById('input-nombre').value;
                const precio = parseFloat(document.getElementById('input-precio').value);
                const cantidad = parseInt(document.getElementById('input-cantidad').value, 10);

                if (!nombre || isNaN(precio) || isNaN(cantidad)) {
                    this.mostrarMensaje('Campos inválidos.', 'error');
                    return;
                }

                const ok = this.agregarProducto({ nombre, precio, cantidad });
                if (!ok) {
                    this.mostrarMensaje('Error al agregar producto.', 'error');
                    return;
                }

                form.reset();
                this.renderTablaInventario();
                if (typeof actualizarStockEnTarjetas === 'function') actualizarStockEnTarjetas();
            });
        }

        if (buscador) {
            buscador.addEventListener('keyup', () => {
                this.renderTablaInventario();
            });
        }

        this.renderTablaInventario();
    }
}

// Cuando la página carga, creamos objeto global inventario y actualizamos pantalla
window.addEventListener('DOMContentLoaded', () => {
    window.inventario = new Inventario();
    window.inventario.inicializarUI();
    if (typeof actualizarStockEnTarjetas === 'function') {
        actualizarStockEnTarjetas();
    }
});
