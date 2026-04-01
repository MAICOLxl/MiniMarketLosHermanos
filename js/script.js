let totalCompra = 0;
let carrito = {}; /*guardar los productos*/

document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('.seccion-contenido');
    const buscador = document.getElementById('buscador');

    function showSection(targetId) {
        sections.forEach(section => {
            section.style.display = 'none';
        });

        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        navLinks.forEach(link => {
            if (link.getAttribute('href') === targetId) {
                link.classList.add('activo');
            } else {
                link.classList.remove('activo');
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            showSection(targetId);
        });
    });

    if (buscador) {
        const listaProductos = document.getElementById('lista-productos');
        const productos = listaProductos.getElementsByClassName('producto');

        buscador.addEventListener('keyup', function () {
            const termino = buscador.value.toLowerCase();

            for (let i = 0; i < productos.length; i++) {
                const producto = productos[i];
                const h3 = producto.getElementsByTagName('h3')[0];
                const textoProducto = h3.textContent.toLowerCase();

                if (textoProducto.includes(termino)) {
                    producto.style.display = '';
                } else {
                    producto.style.display = 'none';
                }
            }
        });
    }

    const listaProductosDiv = document.getElementById('lista-productos');
    if (listaProductosDiv) {
        const productos = listaProductosDiv.getElementsByClassName('producto');
        
        /*controles*/
        for (let i = 0; i < productos.length; i++) {
            const prod = productos[i];
            
            const divControles = document.createElement('div');
            divControles.style.display = 'flex';
            divControles.style.gap = '5px';
            divControles.style.marginTop = '10px';

            /*entrada */
            const input = document.createElement('input');
            input.type = 'number';
            input.value = 1;
            input.min = 1;
            input.style.width = '50px';
            input.style.textAlign = 'center';
            input.style.borderRadius = '5px';
            input.style.border = '1px solid #ddd';

            /*boton agregar*/
            const btn = document.createElement('button');
            btn.innerText = 'Agregar';
            btn.className = 'boton-agregar';
            btn.style.marginTop = '0'; // Alinear con el input
            btn.style.flex = '1';      // Ocupar el resto del espacio
            
            /*llamar funcion agregar*/
            btn.onclick = function() {
                const cantidad = parseInt(input.value) || 1;
                agregarAlCarrito(prod, cantidad);
                input.value = 1; /*reiniciar*/
            };
            
            divControles.appendChild(input);
            divControles.appendChild(btn);
            prod.appendChild(divControles);
        }
    }
    
    showSection('#inicio');
});

function agregarAlCarrito(productoElemento, cantidad) {
    const titulo = productoElemento.getElementsByTagName('h3')[0].innerText;
    const precioTexto = productoElemento.getElementsByTagName('p')[0].innerText;

    /*limpiar precio*/
    let precioLimpio = precioTexto.replace('RD$', '').split('/')[0].replace(',', '').trim();
    let precioNumero = parseFloat(precioLimpio);

    /*validar stock en inventario si existe*/
    if (window.inventario) {
        const vendido = window.inventario.venderProductoPorNombre(titulo, cantidad);
        if (!vendido) {
            alert(`No hay suficiente stock de '${titulo}' para agregar ${cantidad}.`);
            return;
        }
        window.inventario.renderTablaInventario();
    }

    /*algoritmo de agregar */
    if (carrito[titulo]) {
        carrito[titulo].cantidad += cantidad;
        carrito[titulo].subtotal += precioNumero * cantidad;
    } else {
        carrito[titulo] = {
            precioUnitario: precioNumero,
            cantidad: cantidad,
            subtotal: precioNumero * cantidad
        };
    }

    actualizarVistaCarrito();
    if (typeof actualizarStockEnTarjetas === 'function') {
        actualizarStockEnTarjetas();
    }
}

function actualizarStockEnTarjetas() {
    const tarjetas = document.querySelectorAll('.producto');
    tarjetas.forEach((tarjeta) => {
        const nombre = tarjeta.getElementsByTagName('h3')[0].innerText;
        const actualStock = window.inventario ? window.inventario.getStockPorNombre(nombre) : null;

        let stockSpan = tarjeta.querySelector('.stock-indicador');
        if (!stockSpan) {
            stockSpan = document.createElement('span');
            stockSpan.className = 'stock-indicador';
            stockSpan.style.display = 'block';
            stockSpan.style.marginTop = '8px';
            stockSpan.style.fontSize = '0.85rem';
            stockSpan.style.color = '#666';
            tarjeta.appendChild(stockSpan);
        }

        if (actualStock === null) {
            stockSpan.innerText = 'Stock: N/A';
        } else {
            stockSpan.innerText = `Stock: ${actualStock}`;
            stockSpan.style.color = actualStock === 0 ? '#dc3545' : '#28a745';
        }
    });
}

function actualizarVistaCarrito() {
    const contenedorLista = document.getElementById('items-lista');
    contenedorLista.innerHTML = ''; 
    
    totalCompra = 0;

    if (Object.keys(carrito).length === 0) {
        contenedorLista.innerHTML = '<p>No hay productos agregados.</p>';
    } else {
        for (const nombre in carrito) {
            const item = carrito[nombre];
            totalCompra += item.subtotal;

            const nuevoItem = document.createElement('div');
            nuevoItem.className = 'item-lista';
            nuevoItem.innerHTML = `
                <span>${nombre} <strong>(x${item.cantidad})</strong></span> 
                <span>RD$${item.subtotal.toLocaleString('es-es', {minimumFractionDigits: 2})}</span>
            `;
            contenedorLista.appendChild(nuevoItem);
        }
    }

    /*actualizar pantalla */
    document.getElementById('total-precio').innerText = 'RD$' + totalCompra.toLocaleString('en-US', {minimumFractionDigits: 2});
}

function borrarLista() {
    carrito = {};
    actualizarVistaCarrito();
}

let slideIndex = 0;
mostrarSlide();

/*spot publicitario */
function mostrarSlide() {
  let i;
  let slides = document.getElementsByClassName("slide");
  let dots = document.getElementsByClassName("dot");
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  slideIndex++;
  if (slideIndex > slides.length) {slideIndex = 1}    
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";  
  dots[slideIndex-1].className += " active";
  setTimeout(mostrarSlide, 4000);
}