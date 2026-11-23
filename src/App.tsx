import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Activity, BookOpen, ChevronRight, Download, FlaskConical,
  Layers3, Pause, Play, RotateCcw, Settings2, ZoomIn,
} from 'lucide-react';

const zoomLevels = [
  'Pulmão', 'Lóbulo', 'Bronquíolo', 'Alvéolo', 'Macrófago alveolar',
  'Núcleo', 'Fagossomo', 'Fagolisossomo', 'Mycobacterium tuberculosis',
  'Parede celular', 'Citoplasma bacteriano', 'DNA', 'Genes de virulência',
];

const organelles = [
  'Núcleo', 'RER', 'REL', 'Complexo de Golgi', 'Lisossomos',
  'Endossomos', 'Autofagossomos', 'Proteassomas', 'Mitocôndrias', 'Citoesqueleto',
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(3);
  const [running, setRunning] = useState(true);
  const [selected, setSelected] = useState('Alvéolo');
  const [panel, setPanel] = useState<'info' | 'enciclopédia' | 'config'>('info');
  const [particles, setParticles] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#08111e');
    scene.fog = new THREE.FogExp2('#08111e', 0.012);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 4.5, 12);

    const ambient = new THREE.HemisphereLight('#a9ddff', '#251c54', 1.8);
    scene.add(ambient);
    const key = new THREE.DirectionalLight('#70e5ff', 3);
    key.position.set(5, 8, 8);
    scene.add(key);

    const group = new THREE.Group();
    scene.add(group);

    const alveolusMat = new THREE.MeshPhysicalMaterial({
      color: '#4e9ab8', transparent: true, opacity: 0.28,
      roughness: 0.25, transmission: 0.25, side: THREE.DoubleSide,
    });
    const bacteriaMat = new THREE.MeshStandardMaterial({ color: '#db8064', roughness: 0.5 });

    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const radius = 3.7;
      const geo = new THREE.SphereGeometry(i % 3 === 0 ? 1.05 : 0.78, 24, 16);
      const sphere = new THREE.Mesh(geo, alveolusMat);
      sphere.position.set(Math.cos(angle) * radius, Math.sin(angle) * 2.4, (i % 5 - 2) * 0.7);
      group.add(sphere);
    }

    const macrophage = new THREE.Mesh(
      new THREE.SphereGeometry(2.15, 32, 24),
      new THREE.MeshPhysicalMaterial({ color: '#728ad0', transparent: true, opacity: 0.42, roughness: 0.35 }),
    );
    macrophage.position.set(0, 0.15, 0);
    group.add(macrophage);

    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 24, 18),
      new THREE.MeshStandardMaterial({ color: '#b89cff', emissive: '#2d1c63', emissiveIntensity: 0.6 }),
    );
    nucleus.position.set(-0.55, 0.15, 0.15);
    group.add(nucleus);

    for (let i = 0; i < 6; i++) {
      const bac = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 5, 10), bacteriaMat);
      const a = i * 2.1;
      bac.position.set(Math.cos(a) * 1.15, Math.sin(a) * 1.05, 0.6);
      bac.rotation.z = a;
      group.add(bac);
    }

    const particleGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: '#74f3ff' });
    const particlesArr: THREE.Mesh[] = [];
    for (let i = 0; i < 70; i++) {
      const p = new THREE.Mesh(particleGeo, particleMat);
      p.position.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5);
      p.userData.speed = 0.004 + Math.random() * 0.008;
      scene.add(p);
      particlesArr.push(p);
    }

    let frame = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimation.requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (running) {
        group.rotation.y = t * 0.12;
        particlesArr.forEach((p, i) => {
          p.visible = particles;
          p.position.y += p.userData.speed;
          p.position.x += Math.sin(t + i) * 0.002;
          if (p.position.y > 3.3) p.position.y = -3.3;
        });
      }
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      renderer.dispose();
    };
  }, [running, particles]);

  const exportImage = (format: 'png' | 'jpeg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `estudo-biomédico.${format}`;
    link.href = canvas.toDataURL(`image/${format}`, 0.95);
    link.click();
  };

  return (
    <main className="app-shell">
      <aside className="rail">
        <div className="brand-mark"><Activity size={21} /></div>
        <button className="rail-button active" title="Visualização"><Layers3 /></button>
        <button className="rail-button" title="Enciclopédia" onClick={() => setPanel('enciclopédia')}><BookOpen /></button>
        <button className="rail-button" title="Simulação"><FlaskConical /></button>
        <button className="rail-button" title="Configurações" onClick={() => setPanel('config')}><Settings2 /></button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">AMBIENTE DE VISUALIZAÇÃO</span>
            <h1>Estudo Biomédico</h1>
          </div>
          <div className="top-actions">
            <button className="icon-button" onClick={() => setRunning(!running)} title={running ? 'Pausar' : 'Executar'}>
              {running ? <Pause /> : <Play />}
            </button>
            <button className="export-button" onClick={() => exportImage('png')}><Download /> PNG</button>
            <button className="export-button secondary" onClick={() => exportImage('jpeg')}>JPEG</button>
          </div>
        </header>

        <div className="content-grid">
          <section className="viewport-card">
            <div className="viewport-toolbar">
              <span className="status-dot" /> <span>WebGL ativo</span>
              <span className="zoom-label">Zoom {zoom + 1}/{zoomLevels.length}</span>
            </div>
            <canvas ref={canvasRef} aria-label="Renderização WebGL biomédica" />

            <div className="zoom-stack">
              {zoomLevels.slice(Math.max(0, zoom - 3), zoom + 4).map((level) => {
                const actual = zoomLevels.indexOf(level);
                return <button key={level} className={actual === zoom ? 'zoom-item active' : 'zoom-item'} onClick={() => { setZoom(actual); setSelected(level); }}>
                  <span>{actual + 1}</span>{level}
                </button>;
              })}
            </div>

            <div className="zoom-controls">
              <button onClick={() => setZoom(Math.max(0, zoom - 1))}><ChevronRight className="rotate-left" /></button>
              <button onClick={() => setZoom(Math.min(zoomLevels.length - 1, zoom + 1))}><ZoomIn /></button>
            </div>

            <div className="joystick"><div className="joystick-knob"><span>W</span><span>A</span><span>S</span><span>D</span></div></div>

            <div className="minimap">
              <div className="lung left" /><div className="lung right" />
              <div className="trachea" />
              <div className="location-pulse" />
            </div>
          </section>

          <aside className="inspector">
            <div className="tabs">
              <button className={panel === 'info' ? 'active' : ''} onClick={() => setPanel('info')}>Estrutura</button>
              <button className={panel === 'enciclopédia' ? 'active' : ''} onClick={() => setPanel('enciclopédia')}>Enciclopédia</button>
              <button className={panel === 'config' ? 'active' : ''} onClick={() => setPanel('config')}>Partículas</button>
            </div>

            {panel === 'info' && <>
              <div className="selected-name"><span>Estrutura selecionada</span><h2>{selected}</h2></div>
              <div className="section-label">Organização celular</div>
              <div className="organelle-list">
                {organelles.map((item, i) => <button key={item} className={i === 0 ? 'selected' : ''}>
                  <span className="organelle-icon" style={{ '--hue': `${i * 24}deg` } as React.CSSProperties} />
                  {item}<ChevronRight />
                </button>)}
              </div>
            </>}

            {panel === 'enciclopédia' && <div className="encyclopedia">
              <h2>Cascata antimicrobiana</h2>
              <div className="pathway">TLR2 <span>→</span> MyD88 <span>→</span> NF-κB <span>→</span> CYP27B1 <span>→</span> VDR <span>→</span> CAMP <span>→</span> LL-37</div>
              <h3>Apresentação antigênica</h3>
              <p>Peptídeos derivados de MTB podem ser apresentados por MHC-II a linfócitos T auxiliares.</p>
              <h3>Interação fago–bactéria</h3>
              <p>Visualização conceitual de LAM, ESX-1, ESAT-6, CFP-10 e ácidos micólicos. Sistema CRISPR tipo III-A mostrado apenas como analogia educacional.</p>
            </div>}

            {panel === 'config' && <div className="particle-config">
              <h2>Sistemas de partículas</h2>
              {['LL-37', 'ROS', 'RNS', 'Citocinas'].map((name) => <label key={name}><span>{name}</span><input type="checkbox" checked={particles} onChange={(e) => setParticles(e.target.checked)} /></label>)}
              <h3>Navegação</h3>
              <p>WASD: mover • Arrastar: girar • Scroll: zoom</p>
            </div>}
          </aside>
        </div>
      </section>
    </main>
  );
}
