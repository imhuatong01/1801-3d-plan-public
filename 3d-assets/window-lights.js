// Planned WL1 lighting. Coordinates use metres in the unmirrored building model.
export function makeWindowLighting({ THREE, box, beltTop, windowBays }) {
  const fixtures = new THREE.Group();
  const circuit = new THREE.Group();
  fixtures.name = 'window-lights-WL1';
  circuit.name = 'window-lighting-conduit-WL1';

  const longFaceZ = 0.90;
  const shortFaceX = 18.525;
  const lensCenter = 0.047;
  const longConduitZ = longFaceZ + 0.018;
  const shortConduitX = shortFaceX - 0.018;
  const lightY = beltTop - 0.38;
  const busY = lightY - 0.15;
  const lights = [];
  const plate = new THREE.MeshStandardMaterial({ color: '#46535b', roughness: 0.64 });
  const housing = new THREE.MeshStandardMaterial({ color: '#716b60', roughness: 0.48 });
  const diffuser = new THREE.MeshStandardMaterial({
    color: '#fff2ce', emissive: '#ffdb92', emissiveIntensity: 0.74, roughness: 0.68
  });
  const conduit = new THREE.MeshBasicMaterial({ color: '#b16012' });
  const vertical = new THREE.Vector3(0, 1, 0);

  function wire(group, points) {
    for (let i = 1; i < points.length; i++) {
      const a = new THREE.Vector3(...points[i - 1]);
      const b = new THREE.Vector3(...points[i]);
      const direction = b.clone().sub(a);
      const segment = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, direction.length(), 8), conduit);
      segment.position.copy(a).lerp(b, 0.5);
      segment.quaternion.setFromUnitVectors(vertical, direction.normalize());
      group.add(segment);
    }
  }

  function install(face, span, bayCount) {
    const isLong = face === 'long';
    const count = Math.floor(bayCount / 2);
    const halfSpare = (bayCount - 2 * count) / 2;
    for (let i = 0; i < count; i++) {
      const at = span * (halfSpare + 2 * i + 1) / bayCount;
      const id = 'L' + String(lights.length + 1).padStart(2, '0');
      const light = {
        id, face, circuit: 'WL1', y: lightY,
        x: isLong ? at : shortFaceX - lensCenter,
        z: isLong ? longFaceZ + lensCenter : at
      };
      const fixture = new THREE.Group();
      fixture.name = id;
      fixture.userData = { ...light };
      fixture.position.set(isLong ? at : shortFaceX, lightY, isLong ? longFaceZ : at);
      if (!isLong) fixture.rotation.y = -Math.PI / 2;
      fixtures.add(fixture);
      box(fixture, -0.35, -0.084, 0, 0.70, 0.168, 0.028, plate);
      box(fixture, -0.32, -0.070, 0.028, 0.64, 0.140, 0.040, housing);
      box(fixture, -0.292, -0.048, 0.068, 0.584, 0.096, 0.026, diffuser);
      const branch = new THREE.Group();
      branch.name = 'WL1-' + id;
      circuit.add(branch);
      const x = isLong ? at : shortConduitX;
      const z = isLong ? longConduitZ : at;
      wire(branch, [[x, busY, z], [x, lightY - 0.073, z]]);
      lights.push(light);
    }
  }
  install('long', 19.425, windowBays.long);
  install('short', 9.40, windowBays.short);

  // One rise on the solid end wall. Two short offsets pass in front of the
  // existing concrete columns. The beam-side run ends at the final fixture.
  const feed = new THREE.Group();
  feed.name = 'WL1-panel-to-window-belt';
  circuit.add(feed);
  const floorY = 0.025;
  wire(feed, [
    [8.25, 1.05, 7.555], [8.25, floorY, 7.555], [0.078, floorY, 7.555],
    [0.078, floorY, longConduitZ], [0.078, busY, longConduitZ],
    [8.625, busY, longConduitZ], [8.625, busY, 1.025], [9.175, busY, 1.025],
    [9.175, busY, longConduitZ], [18.400, busY, longConduitZ], [18.400, busY, 1.025],
    [shortConduitX, busY, 1.025], [shortConduitX, busY, lights.at(-1).z]
  ]);
  return { fixtures, circuit, lights };
}
