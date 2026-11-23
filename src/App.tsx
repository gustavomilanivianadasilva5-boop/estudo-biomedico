import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Activity, BookOpen, ChevronRight, Download, FlaskConical,
  Layers3, Menu, Pause, Play, Settings2, ZoomIn, X,
} from 'lucide-react';

const zoomLevels = [
  'Pulmão', 'Lóbulo', 'Bronquíolo', 'Alvéolo', 'Macrófago alveolar',
  'Núcleo', 'Fagossomo', 'Fagolisossomo', 'Mycobacterium tuberculosis',
  'Parede celular', 'Citoplasma bacteriano', 'DNA', 'Genes de virulência',
];
const organelles = ['Núcleo', 'RER', 'REL', 'Complexo de Golgi', 'Lisossomos', 'Endossomos', 'Autofagossomos', 'Proteassomas', 'Mitocôndrias', 'Citoesqueleto'];
type Panel = 'info' | 'enciclopédia' | 'config';
type Direction = { x: number; y: number };

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{ camera: THREE.PerspectiveCamera; group: THREE.Group } | null>(null);
  const runningRef = useRef(true);
  const particlesEnabledRef = useRef(true);
  const directionRef = useRef<Direction>({ x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const lastPinchRef = useRef(0);
  const [zoom, setZoom] = useState(3);
  const [running, setRunning] = useState(true);
  const [selected, setSelected] = useState('Alvéolo');
  const [panel, setPanel] = useState<Panel>('info');
  const [particles, setParticles] = useState(true);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [joystick, setJoystick] = useState<Direction>({ x: 0, y: 0 });

  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { particlesEnabledRef.current = particles; }, [particles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#08111e');
    scene.fog = new THREE.FogExp2('#08111e', 0.012);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 14);
    sceneRef.current = { camera, group: new THREE.Group() };
    const group = sceneRef.current.group;
    scene.add(group);
    scene.add(new THREE.HemisphereLight('#a9ddff', '#251c54', 1.8));
    const key = new THREE.DirectionalLight('#70e5ff', 3);
    key.position.set(5, 8, 8);
    scene.add(key);

    const alveolusMat = new THREE.MeshPhysicalMaterial({ color: '#4e9ab8', transparent: true, opacity: 0.28, roughness: 0.25, transmission: 0.25, side: THREE.DoubleSide });
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(i % 3 === 0 ? 1.05 : 0.78, 24, 16), alveolusMat);
      sphere.position.set(Math.cos(angle) * 3.7, Math.sin(angle) * 2.4, (i % 5 - 2) * 0.7);
      group.add(sphere);
    }
    const macrophage = new THREE.Mesh(new THREE.SphereGeometry(2.15, 32, 24), new THREE.MeshPhysicalMaterial({ color: '#728ad0', transparent: true, opacity: 0.42, roughness: 0.35 }));
    macrophage.position.set(0, 0.15, 0);
    group.add(macrophage);
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 18), new THREE.MeshStandardMaterial({ color: '#b89cff', emissive: '#2d1c63', emissiveIntensity: 0.6 }));
    nucleus.position.set(-0.55, 0.15, 0.15);
    group.add(nucleus);
    const bacteriaMat = new THREE.MeshStandardMaterial({ color: '#db8064', roughness: 0.5 });
    for (let i = 0; i < 6; i++) {
      const bac = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 5, 10), bacteriaMat);
      const angle = i * 2.1;
      bac.position.set(Math.cos(angle) * 1.15, Math.sin(angle) * 1.05, 0.6);
      bac.rotation.z = angle;
      group.add(bac);
    }
    const particleGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: '#74f3ff' });
    const particleMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < 70; i++) {
      const p = new THREE.Mesh(particleGeo, particleMat);
      p.position.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5);
      p.userData.speed = 0.004 + Math.random() * 0.008;
      scene.add(p);
      particleMeshes.push(p);
    }

    let frame = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (runningRef.current) {
        group.rotation.y += 0.0015;
        group.position.x += directionRef.current.x * 0.025;
        group.position.y += directionRef.current.y * 0.025;
        group.position.x = THREE.MathUtils.clamp(group.position.x, -2, 2);
        group.position.y = THREE.MathUtils.clamp(group.position.y, -2, 2);
        particleMeshes.forEach((p, i) => {
          p.visible = particlesEnabledRef.current;
          p.position.y += p.userData.speed;
          p.position.x += Math.sin(t + i) * 0.002;
          if (p.position.y > 3.3) p.position.y = -3.3;
        });
      }
      renderer.render(scene, camera);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    animate();
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          (Array.isArray(material) ? material : [material]).forEach((item) => item.dispose());
        }
      });
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const camera = sceneRef.current?.camera;
    if (camera) {
      camera.position.z = THREE.MathUtils.lerp(14, 5.2, zoom / (zoomLevels.length - 1));
      camera.updateProjectionMatrix();
    }
  }, [zoom]);

  useEffect(() => {
    const pressed = new Set<string>();
    const update = () => {
      directionRef.current = {
        x: (pressed.has('d') || pressed.has('arrowright') ? 1 : 0) - (pressed.has('a') || pressed.has('arrowleft') ? 1 : 0) + directionRef.current.x,
        y: (pressed.has('w') || pressed.has('arrowup') ? 1 : 0) - (pressed.has('s') || pressed.has('arrowdown') ? 1 : 0) + directionRef.current.y,
      };
    };
    const down = (event: KeyboardEvent) => { pressed.add(event.key.toLowerCase()); update(); };
    const up = (event: KeyboardEvent) => { pressed.delete(event.key.toLowerCase()); update(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const changeZoom = (value: number) => setZoom(Math.max(0, Math.min(zoomLevels.length - 1, value)));
  const exportImage = (format: 'png' | 'jpeg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `estudo-biomedico.${format}`;
    link.href = canvas.toDataURL(`image/${format}`, 0.95);
    link.click();
  };
  const setDirectionFromPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    const length = Math.max(1, Math.hypot(dx, dy));
    const next = { x: (dx / length) * Math.min(1, Math.hypot(dx, dy)), y: (-dy / length) * Math.min(1, Math.hypot(dx, dy)) };
    setJoystick(next);
    directionRef.current = next;
  };
  const stopJoystick = () => { setJoystick({ x: 0, y: 0 }); directionRef.current = { x: 0, y: 0 }; };
  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      lastPinchRef.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };
  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    const previous = pointersRef.current.get(event.pointerId)!;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size >= 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastPinchRef.current) changeZoom(zoom + (distance > lastPinchRef.current ? 1 : -1));
      lastPinchRef.current = distance;
    } else {
      const group = sceneRef.current?.group;
      if (group) {
        group.rotation.y += (event.clientX - previous.x) * 0.006;
        group.rotation.x += (event.clientY - previous.y) * 0.004;
      }
    }
  };
  const handleCanvasPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) lastPinchRef.current = 0;
  };

  const openPanel = (next: Panel) => { setPanel(next); setMobilePanelOpen(true); };
  return (
    <main className="app-shell">
      <aside className="rail">
        <div className="brand-mark"><Activity size={21} /></div>
        <button className="rail-button active" title="Visualização"><Layers3 /></button>
        <button className="rail-button" title="Enciclopédia" onClick={() => openPanel('enciclopédia')}><BookOpen /></button>
        <button className="rail-button" title="Simulação" onClick={() => openPanel('config')}><FlaskConical /></button>
        <button className="rail-button" title="Configurações" onClick={() => openPanel('config')}><Settings2 /></button>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div className="title-block"><span className="eyebrow">AMBIENTE DE VISUALIZAÇÃO</span><h1>Estudo Biomédico</h1></div>
          <div className="top-actions">
            <button className="icon-button" onClick={() => setRunning(!running)} title={running ? 'Pausar' : 'Executar'}>{running ? <Pause /> : <Play />}</button>
            <button className="export-button" onClick={() => exportImage('png')}><Download /> <span>PNG</span></button>
            <button className="export-button secondary" onClick={() => exportImage('jpeg')}>JPEG</button>
          </div>
        </header>
        <div className="content-grid">
          <section className="viewport-card">
            <div className="viewport-toolbar"><span className="status-dot" /> <span>WebGL ativo</span><span className="zoom-label">Zoom {zoom + 1}/{zoomLevels.length}</span></div>
            <canvas ref={canvasRef} aria-label="Renderização WebGL biomédica" onPointerDown={handleCanvasPointerDown} onPointerMove={handleCanvasPointerMove} onPointerUp={handleCanvasPointerUp} onPointerCancel={handleCanvasPointerUp} />
            <div className="zoom-stack">{zoomLevels.slice(Math.max(0, zoom - 3), zoom + 4).map((level) => {
              const actual = zoomLevels.indexOf(level);
              return <button key={level} className={actual === zoom ? 'zoom-item active' : 'zoom-item'} onClick={() => { changeZoom(actual); setSelected(level); }}><span>{actual + 1}</span>{level}</button>;
            })}</div>
            <div className="zoom-controls"><button aria-label="Diminuir zoom" onClick={() => changeZoom(zoom - 1)}><ChevronRight className="rotate-left" /></button><button aria-label="Aumentar zoom" onClick={() => changeZoom(zoom + 1)}><ZoomIn /></button></div>
            <button className="joystick" aria-label="Joystick virtual multitoque" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDirectionFromPointer(event); }} onPointerMove={(event) => { if (event.buttons) setDirectionFromPointer(event); }} onPointerUp={stopJoystick} onPointerCancel={stopJoystick}>
              <span className="joystick-knob" style={{ transform: `translate(${joystick.x * 16}px, ${-joystick.y * 16}px)` }}><span>W</span><span>A</span><span>S</span><span>D</span></span>
            </button>
            <div className="minimap" aria-label="Minimapa pulmonar"><div className="lung left" /><div className="lung right" /><div className="trachea" /><div className="location-pulse" /></div>
            <div className="gesture-hint">Arraste para girar · Pinça para zoom</div>
          </section>
          <aside className={`inspector ${mobilePanelOpen ? 'mobile-open' : ''}`}>
            <div className="mobile-panel-head"><strong>{panel === 'info' ? 'Estrutura' : panel === 'enciclopédia' ? 'Enciclopédia' : 'Partículas'}</strong><button onClick={() => setMobilePanelOpen(false)} aria-label="Fechar painel"><X /></button></div>
            <div className="tabs"><button className={panel === 'info' ? 'active' : ''} onClick={() => setPanel('info')}>Estrutura</button><button className={panel === 'enciclopédia' ? 'active' : ''} onClick={() => setPanel('enciclopédia')}>Enciclopédia</button><button className={panel === 'config' ? 'active' : ''} onClick={() => setPanel('config')}>Partículas</button></div>
            {panel === 'info' && <><div className="selected-name"><span>Estrutura selecionada</span><h2>{selected}</h2></div><div className="section-label">Organização celular</div><div className="organelle-list">{organelles.map((item, i) => <button key={item} className={i === 0 ? 'selected' : ''} onClick={() => setSelected(item)}><span className="organelle-icon" style={{ '--hue': `${i * 24}deg` } as React.CSSProperties} />{item}<ChevronRight /></button>)}</div></>}
            {panel === 'enciclopédia' && <div className="encyclopedia"><h2>Cascata antimicrobiana</h2><div className="pathway">TLR2 <span>→</span> MyD88 <span>→</span> NF-κB <span>→</span> CYP27B1 <span>→</span> VDR <span>→</span> CAMP <span>→</span> LL-37</div><h3>Apresentação antigênica</h3><p>Peptídeos derivados de MTB podem ser apresentados por MHC-II a linfócitos T auxiliares.</p><h3>Interação fago–bactéria</h3><p>Visualização conceitual de LAM, ESX-1, ESAT-6, CFP-10, ácidos micólicos e genes esxA, esxB, katG, inhA, rpoB e embB. CRISPR tipo III-A aparece como modelo conceitual, não como protocolo experimental.</p></div>}
            {panel === 'config' && <div className="particle-config"><h2>Sistemas de partículas</h2>{['LL-37', 'ROS', 'RNS', 'Citocinas'].map((name) => <label key={name}><span>{name}</span><input type="checkbox" checked={particles} onChange={(event) => setParticles(event.target.checked)} /></label>)}<h3>Navegação</h3><p>WASD: mover • Arrastar: girar • Pinça/scroll: zoom</p></div>}
          </aside>
        </div>
        <nav className="mobile-nav" aria-label="Navegação mobile"><button onClick={() => setMobilePanelOpen(false)}><Layers3 /><span>Visualizar</span></button><button onClick={() => openPanel('info')}><Activity /><span>Estrutura</span></button><button onClick={() => openPanel('enciclopédia')}><BookOpen /><span>Enciclopédia</span></button><button onClick={() => openPanel('config')}><FlaskConical /><span>Partículas</span></button></nav>
      </section>
    </main>
  );
}
