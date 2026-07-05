import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const pagina = document.body.dataset.page;
if (pagina !== 'home') {
    inicializarFluxo3D(pagina);
}

function inicializarFluxo3D(tipoFigura) {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // 1. CONFIGURAÇÃO DA CENA E AMBIENTE (ORTOGRÁFICO)
    const cena = new THREE.Scene();
    cena.background = new THREE.Color(0xffffff);

    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 18; // Tamanho do campo de visão
    const camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        -50, 1000 // Near negativo permite ver o objeto mesmo de ângulos próximos
    );
    camera.position.set(10, 10, 15);
    camera.lookAt(0, 0, 0);

    const renderizador = new THREE.WebGLRenderer({ antialias: true });
    renderizador.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderizador.domElement);

    // Renderizador para Textos HTML flutuantes
    const cssRenderer = new CSS2DRenderer();
    cssRenderer.setSize(container.clientWidth, container.clientHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0px';
    cssRenderer.domElement.style.pointerEvents = 'none'; // Não bloqueia o mouse no canvas
    container.appendChild(cssRenderer.domElement);

    // Controles apenas pelo Mouse
    const controles = new OrbitControls(camera, renderizador.domElement);
    controles.enableDamping = true;
    controles.enableZoom = false; // Desativamos o zoom do mouse rodinha para usar apenas os botões se preferir (ou mantenha ativado).
    // Para manter a roda do mouse:
    controles.enableZoom = true;

    // Iluminação
    cena.add(new THREE.AmbientLight(0xffffff, 0.7));
    const luzDirecional = new THREE.DirectionalLight(0xffffff, 0.6);
    luzDirecional.position.set(10, 20, 10);
    cena.add(luzDirecional);

    // Grupo principal para facilitar a rotação pelos botões
    const grupoFigura = new THREE.Group();
    cena.add(grupoFigura);

    // UTILITÁRIO: Criar Material para as Faces (Cores independentes)
    function gerarMateriaisFaces() {
        const corGeral = document.getElementById('cor-geral').value;
        const opacidadeGeral = corGeral === 'transparente' ? 0.15 : 0.9;
        const matBase = new THREE.MeshPhongMaterial({ 
            color: corGeral === 'transparente' ? 0xbdc3c7 : corGeral, 
            transparent: true, opacity: opacidadeGeral, side: THREE.DoubleSide 
        });

        const selects = [
            document.getElementById('face-0'), // Direita (+x)
            document.getElementById('face-1'), // Esquerda (-x)
            document.getElementById('face-2'), // Cima (+y)
            document.getElementById('face-3'), // Baixo (-y)
            document.getElementById('face-4'), // Frente (+z)
            document.getElementById('face-5')  // Trás (-z)
        ];

        // Se os selects não existirem (ex: Cilindro), retorna material simples
        if (!selects[0]) return matBase;

        const materiais = [];
        for (let i = 0; i < 6; i++) {
            const val = selects[i].value;
            if (val === 'padrao') {
                materiais.push(matBase);
            } else if (val === 'transparente') {
                materiais.push(new THREE.MeshPhongMaterial({ color: 0xbdc3c7, transparent: true, opacity: 0.15, side: THREE.DoubleSide }));
            } else {
                materiais.push(new THREE.MeshPhongMaterial({ color: val, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
            }
        }
        return materiais; // Retorna array para BoxGeometry
    }

    // UTILITÁRIO: Criar Texto 3D (Rótulos)
    function criarRotulo(texto, posX, posY, posZ) {
        const div = document.createElement('div');
        div.className = 'label-3d';
        div.textContent = texto;
        const label = new CSS2DObject(div);
        label.position.set(posX, posY, posZ);
        return label;
    }

    // --- MOTORES ESPECÍFICOS ---
    function atualizarCubo() {
        grupoFigura.clear();

        const a = parseFloat(document.getElementById('input-a').value);
        document.getElementById('val-a').innerText = `${a} cm`;

        const geo = new THREE.BoxGeometry(a, a, a);
        const malha = new THREE.Mesh(geo, gerarMateriaisFaces());
        grupoFigura.add(malha);

        const verMedidas = document.getElementById('ver-medidas').value;
        if (verMedidas === 'mostrar') {
            // Arestas
            const linhas = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
            grupoFigura.add(linhas);
            
            // Textos "L", "C", "H" nas bordas
            grupoFigura.add(criarRotulo('C', 0, -a/2, a/2)); // Base frente
            grupoFigura.add(criarRotulo('L', a/2, -a/2, 0)); // Base direita
            grupoFigura.add(criarRotulo('H', a/2, 0, a/2));  // Altura direita frente

            document.getElementById('info-medidas-texto').innerText = `L = C = H = ${a} cm`;
        } else {
            document.getElementById('info-medidas-texto').innerText = "Oculto";
        }

        const corVert = document.getElementById('cor-vertices').value;
        if (corVert !== 'nao') {
            const tamVert = parseFloat(document.getElementById('tamanho-vertices').value);
            document.getElementById('val-vert').innerText = tamVert;
            const matPonto = new THREE.PointsMaterial({ color: corVert, size: tamVert });
            grupoFigura.add(new THREE.Points(geo, matPonto));
        }

        const areaBase = (a * a).toFixed(2);
        const volume = (areaBase * a).toFixed(2);
        document.getElementById('calc-area').innerHTML = `A<sub>b</sub> = C × L = ${a} × ${a} = <strong>${areaBase} cm²</strong>`;
        document.getElementById('calc-volume').innerHTML = `V = A<sub>b</sub> × H = ${areaBase} × ${a} = <strong>${volume} cm³</strong>`;
    }

    function atualizarBloco() {
        grupoFigura.clear();

        const c = parseFloat(document.getElementById('input-c').value);
        const l = parseFloat(document.getElementById('input-l').value);
        const h = parseFloat(document.getElementById('input-h').value);

        document.getElementById('val-c').innerText = `${c} cm`;
        document.getElementById('val-l').innerText = `${l} cm`;
        document.getElementById('val-h').innerText = `${h} cm`;

        const geo = new THREE.BoxGeometry(c, h, l);
        const malha = new THREE.Mesh(geo, gerarMateriaisFaces());
        grupoFigura.add(malha);

        const verMedidas = document.getElementById('ver-medidas').value;
        if (verMedidas === 'mostrar') {
            const linhas = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x000000 }));
            grupoFigura.add(linhas);

            grupoFigura.add(criarRotulo('C', 0, -h/2, l/2));
            grupoFigura.add(criarRotulo('L', c/2, -h/2, 0));
            grupoFigura.add(criarRotulo('H', c/2, 0, l/2));

            document.getElementById('info-medidas-texto').innerText = `C = ${c} cm | L = ${l} cm | H = ${h} cm`;
        } else {
            document.getElementById('info-medidas-texto').innerText = "Oculto";
        }

        const corVert = document.getElementById('cor-vertices').value;
        if (corVert !== 'nao') {
            const tamVert = parseFloat(document.getElementById('tamanho-vertices').value);
            document.getElementById('val-vert').innerText = tamVert;
            grupoFigura.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: corVert, size: tamVert })));
        }

        const areaBase = (c * l).toFixed(2);
        const volume = (areaBase * h).toFixed(2);
        document.getElementById('calc-area').innerHTML = `A<sub>b</sub> = C × L = ${c} × ${l} = <strong>${areaBase} cm²</strong>`;
        document.getElementById('calc-volume').innerHTML = `V = A<sub>b</sub> × H = ${areaBase} × ${h} = <strong>${volume} cm³</strong>`;
    }

    function atualizarCilindro() {
        grupoFigura.clear();

        const r = parseFloat(document.getElementById('input-r').value);
        const h = parseFloat(document.getElementById('input-h').value);
        const modoPi = document.getElementById('select-pi').value;

        document.getElementById('val-r').innerText = `${r} cm`;
        document.getElementById('val-h').innerText = `${h} cm`;

        const geo = new THREE.CylinderGeometry(r, r, h, 32);
        const cor = document.getElementById('cor-geral').value;
        const opacidade = cor === 'transparente' ? 0.2 : 0.9;
        const malha = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: cor === 'transparente' ? 0xbdc3c7 : cor, transparent: true, opacity: opacidade }));
        grupoFigura.add(malha);

        const verElem = document.getElementById('ver-elementos').value;
        if (verElem === 'tudo-preto') {
            const linhas = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x000000 }));
            grupoFigura.add(linhas);
        }

        const verMedidas = document.getElementById('ver-medidas').value;
        if (verMedidas === 'mostrar') {
            grupoFigura.add(criarRotulo('R', r/2, h/2, 0)); // Tampa superior
            grupoFigura.add(criarRotulo('H', r + 0.5, 0, 0)); // Lado

            document.getElementById('info-medidas-texto').innerText = `R = ${r} cm | H = ${h} cm`;
        } else {
            document.getElementById('info-medidas-texto').innerText = "Oculto";
        }

        let strPi = modoPi === 'simbolo' ? 'π' : modoPi;
        let fatorPi = modoPi === 'simbolo' ? 1 : parseFloat(modoPi);
        let abValor = (r * r * fatorPi).toFixed(2);
        let volValor = (r * r * h * fatorPi).toFixed(2);
        let resAb = modoPi === 'simbolo' ? `${(r*r).toFixed(2)}π` : abValor;
        let resVol = modoPi === 'simbolo' ? `${(r*r*h).toFixed(2)}π` : volValor;

        document.getElementById('calc-area').innerHTML = `A<sub>b</sub> = π × R² = ${strPi} × ${r}² = <strong>${resAb} cm²</strong>`;
        document.getElementById('calc-volume').innerHTML = `V = A<sub>b</sub> × H = (${resAb}) × ${h} = <strong>${resVol} cm³</strong>`;
    }

    // --- EVENTOS DE INTERFACE ---
    const addEv = (id, func) => { const el = document.getElementById(id); if (el) { el.addEventListener('input', func); el.addEventListener('change', func); } };

    if (tipoFigura === 'cubo') {
        document.getElementById('input-a').value = 4;
        ['input-a', 'cor-geral', 'cor-vertices', 'tamanho-vertices', 'ver-medidas'].forEach(id => addEv(id, atualizarCubo));
        for(let i=0; i<6; i++) addEv(`face-${i}`, atualizarCubo);
        atualizarCubo();
    } else if (tipoFigura === 'bloco') {
        document.getElementById('input-c').value = 6; document.getElementById('input-l').value = 4; document.getElementById('input-h').value = 5;
        ['input-c', 'input-l', 'input-h', 'cor-geral', 'cor-vertices', 'tamanho-vertices', 'ver-medidas'].forEach(id => addEv(id, atualizarBloco));
        for(let i=0; i<6; i++) addEv(`face-${i}`, atualizarBloco);
        atualizarBloco();
    } else if (tipoFigura === 'cilindro') {
        document.getElementById('input-r').value = 3; document.getElementById('input-h').value = 6;
        ['input-r', 'input-h', 'cor-geral', 'select-pi', 'ver-elementos', 'ver-medidas'].forEach(id => addEv(id, atualizarCilindro));
        atualizarCilindro();
    }

    // --- BOTÕES DA CÂMERA E ROTAÇÃO ---
    // Zoom altera a escala da câmera ortográfica (menor zoom value = imagem maior)
    document.getElementById('btn-zoom-in').addEventListener('click', () => { camera.zoom += 0.2; camera.updateProjectionMatrix(); });
    document.getElementById('btn-zoom-out').addEventListener('click', () => { camera.zoom = Math.max(0.2, camera.zoom - 0.2); camera.updateProjectionMatrix(); });
    
    document.getElementById('btn-reset-cam').addEventListener('click', () => {
        camera.zoom = 1; camera.updateProjectionMatrix();
        camera.position.set(10, 10, 15);
        grupoFigura.rotation.set(0,0,0);
        controles.target.set(0,0,0);
    });

    // Rotação atuando sobre o Grupo (as letras acompanham!)
    const passoRot = 0.15;
    document.getElementById('btn-rot-up').addEventListener('click', () => { grupoFigura.rotation.x -= passoRot; });
    document.getElementById('btn-rot-down').addEventListener('click', () => { grupoFigura.rotation.x += passoRot; });
    document.getElementById('btn-rot-left').addEventListener('click', () => { grupoFigura.rotation.y -= passoRot; });
    document.getElementById('btn-rot-right').addEventListener('click', () => { grupoFigura.rotation.y += passoRot; });

    // Responsividade
    window.addEventListener('resize', () => {
        const novoAspect = container.clientWidth / container.clientHeight;
        camera.left = -frustumSize * novoAspect / 2;
        camera.right = frustumSize * novoAspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.updateProjectionMatrix();
        renderizador.setSize(container.clientWidth, container.clientHeight);
        cssRenderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Loop
    function loop() {
        requestAnimationFrame(loop);
        controles.update();
        renderizador.render(cena, camera);
        cssRenderer.render(cena, camera);
    }
    loop();
}