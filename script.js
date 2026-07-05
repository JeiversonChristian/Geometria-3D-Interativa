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

    // Fundo escuro adaptado para o Dark Mode
    const cena = new THREE.Scene();
    cena.background = new THREE.Color(0x1e293b); // Slate 800 do CSS

    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 18; 
    const camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        -50, 1000 
    );
    camera.position.set(10, 10, 15);
    camera.lookAt(0, 0, 0);

    const renderizador = new THREE.WebGLRenderer({ antialias: true });
    renderizador.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderizador.domElement);

    const cssRenderer = new CSS2DRenderer();
    cssRenderer.setSize(container.clientWidth, container.clientHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0px';
    cssRenderer.domElement.style.pointerEvents = 'none'; 
    container.appendChild(cssRenderer.domElement);

    const controles = new OrbitControls(camera, renderizador.domElement);
    controles.enableDamping = true;
    controles.enableZoom = true;
    controles.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE, 
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE 
    };

    // Luzes otimizadas para materiais sobre fundo escuro
    cena.add(new THREE.AmbientLight(0xffffff, 0.8));
    const luzDirecional = new THREE.DirectionalLight(0xffffff, 0.5);
    luzDirecional.position.set(10, 20, 10);
    cena.add(luzDirecional);

    const grupoFigura = new THREE.Group();
    cena.add(grupoFigura);

    // Agora a cor base de contorno padrão é branca/clara para destacar no fundo escuro
    const COR_CONTORNO = 0xffffff;

    function gerarMateriaisFaces() {
        const corGeral = document.getElementById('cor-geral').value;
        const opacidadeGeral = corGeral === 'transparente' ? 0.15 : 0.9;
        const matBase = new THREE.MeshPhongMaterial({ 
            color: corGeral === 'transparente' ? 0x94a3b8 : corGeral, 
            transparent: true, opacity: opacidadeGeral, side: THREE.DoubleSide 
        });

        const selects = [
            document.getElementById('face-0'), document.getElementById('face-1'), 
            document.getElementById('face-2'), document.getElementById('face-3'), 
            document.getElementById('face-4'), document.getElementById('face-5')  
        ];

        if (!selects[0]) return matBase;

        const materiais = [];
        for (let i = 0; i < 6; i++) {
            const val = selects[i].value;
            if (val === 'padrao') materiais.push(matBase);
            else if (val === 'transparente') materiais.push(new THREE.MeshPhongMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.15, side: THREE.DoubleSide }));
            else materiais.push(new THREE.MeshPhongMaterial({ color: val, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
        }
        return materiais; 
    }

    function gerarMateriaisCilindro() {
        const corGeral = document.getElementById('cor-geral').value;
        const opacidadeGeral = corGeral === 'transparente' ? 0.2 : 0.9;
        const matGeralBase = new THREE.MeshPhongMaterial({ 
            color: corGeral === 'transparente' ? 0x94a3b8 : corGeral, 
            transparent: true, opacity: opacidadeGeral, side: THREE.DoubleSide 
        });

        const selLat = document.getElementById('cil-lateral');
        const selTop = document.getElementById('cil-topo');
        const selBase = document.getElementById('cil-base');

        if (!selLat) return matGeralBase;

        const obterMat = (selectElement) => {
            const val = selectElement.value;
            if (val === 'padrao') return matGeralBase;
            if (val === 'transparente') return new THREE.MeshPhongMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
            return new THREE.MeshPhongMaterial({ color: val, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
        };
        return [obterMat(selLat), obterMat(selTop), obterMat(selBase)];
    }

    function criarRotulo(texto, posX, posY, posZ) {
        const div = document.createElement('div');
        div.className = 'label-3d';
        div.textContent = texto;
        const label = new CSS2DObject(div);
        label.position.set(posX, posY, posZ);
        return label;
    }

    function atualizarCubo() {
        grupoFigura.clear();
        const a = parseFloat(document.getElementById('input-a').value);
        document.getElementById('val-a').innerText = `${a} cm`;

        const geo = new THREE.BoxGeometry(a, a, a);
        grupoFigura.add(new THREE.Mesh(geo, gerarMateriaisFaces()));

        if (document.getElementById('ver-medidas').value === 'mostrar') {
            grupoFigura.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: COR_CONTORNO, linewidth: 2 })));
            grupoFigura.add(criarRotulo('C', 0, -a/2, a/2)); 
            grupoFigura.add(criarRotulo('L', a/2, -a/2, 0)); 
            grupoFigura.add(criarRotulo('H', a/2, 0, a/2));  
            document.getElementById('info-medidas-texto').innerText = `L = C = H = ${a} cm`;
        } else {
            document.getElementById('info-medidas-texto').innerText = "Oculto";
        }

        const corVert = document.getElementById('cor-vertices').value;
        if (corVert !== 'nao') {
            const tamVert = parseFloat(document.getElementById('tamanho-vertices').value);
            document.getElementById('val-vert').innerText = `${tamVert} px`;
            grupoFigura.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: corVert, size: tamVert, sizeAttenuation: false })));
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
        grupoFigura.add(new THREE.Mesh(geo, gerarMateriaisFaces()));

        if (document.getElementById('ver-medidas').value === 'mostrar') {
            grupoFigura.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: COR_CONTORNO })));
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
            document.getElementById('val-vert').innerText = `${tamVert} px`;
            grupoFigura.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: corVert, size: tamVert, sizeAttenuation: false })));
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
        grupoFigura.add(new THREE.Mesh(geo, gerarMateriaisCilindro()));

        if (document.getElementById('ver-elementos').value === 'tudo-claro') {
            grupoFigura.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: COR_CONTORNO })));
        }

        if (document.getElementById('ver-medidas').value === 'mostrar') {
            const ptsRaio = [new THREE.Vector3(0, h/2, 0), new THREE.Vector3(r, h/2, 0)];
            grupoFigura.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsRaio), new THREE.LineBasicMaterial({ color: COR_CONTORNO, linewidth: 3 })));
            
            const bolaCentro = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshBasicMaterial({ color: COR_CONTORNO }));
            bolaCentro.position.set(0, h/2, 0);
            grupoFigura.add(bolaCentro);

            grupoFigura.add(criarRotulo('R', r/2, h/2 + 0.3, 0)); 
            grupoFigura.add(criarRotulo('H', r + 0.3, 0, 0)); 
            document.getElementById('info-medidas-texto').innerText = `R = ${r} cm | H = ${h} cm`;
        } else {
            document.getElementById('info-medidas-texto').innerText = "Oculto";
        }

        let strPi = modoPi === 'simbolo' ? 'π' : modoPi;
        let fatorPi = modoPi === 'simbolo' ? 1 : parseFloat(modoPi);
        let abValor = (r * r * fatorPi).toFixed(2);
        let volValor = (r * r * h * fatorPi).toFixed(2);
        document.getElementById('calc-area').innerHTML = `A<sub>b</sub> = π × R² = ${strPi} × ${r}² = <strong>${modoPi === 'simbolo' ? `${(r*r).toFixed(2)}π` : abValor} cm²</strong>`;
        document.getElementById('calc-volume').innerHTML = `V = A<sub>b</sub> × H = (${modoPi === 'simbolo' ? `${(r*r).toFixed(2)}π` : abValor}) × ${h} = <strong>${modoPi === 'simbolo' ? `${(r*r*h).toFixed(2)}π` : volValor} cm³</strong>`;
    }

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
        ['input-r', 'input-h', 'cor-geral', 'select-pi', 'ver-elementos', 'ver-medidas', 'cil-lateral', 'cil-topo', 'cil-base'].forEach(id => addEv(id, atualizarCilindro));
        atualizarCilindro();
    }

    document.getElementById('btn-zoom-in').addEventListener('click', () => { camera.zoom += 0.2; camera.updateProjectionMatrix(); });
    document.getElementById('btn-zoom-out').addEventListener('click', () => { camera.zoom = Math.max(0.2, camera.zoom - 0.2); camera.updateProjectionMatrix(); });
    document.getElementById('btn-reset-cam').addEventListener('click', () => {
        camera.zoom = 1; camera.updateProjectionMatrix();
        camera.position.set(10, 10, 15);
        grupoFigura.rotation.set(0,0,0);
        controles.target.set(0,0,0);
    });

    const passoRot = 0.15;
    document.getElementById('btn-rot-up').addEventListener('click', () => { grupoFigura.rotation.x -= passoRot; });
    document.getElementById('btn-rot-down').addEventListener('click', () => { grupoFigura.rotation.x += passoRot; });
    document.getElementById('btn-rot-left').addEventListener('click', () => { grupoFigura.rotation.y -= passoRot; });
    document.getElementById('btn-rot-right').addEventListener('click', () => { grupoFigura.rotation.y += passoRot; });

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

    function loop() {
        requestAnimationFrame(loop);
        controles.update();
        renderizador.render(cena, camera);
        cssRenderer.render(cena, camera);
    }
    loop();
}