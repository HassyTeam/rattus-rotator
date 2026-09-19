import { useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { PresentationControls, useTexture } from '@react-three/drei'
import { OBJLoader } from 'three-stdlib'
import { Mesh, SRGBColorSpace } from "three";

function Model(props: any) {
    //try {
        const obj = useLoader(OBJLoader, 'https://spinningrat.online/assets/rat/rat.obj')
        const texture = useTexture('https://spinningrat.online/assets/rat/rat.jpg')

        useLayoutEffect(() => {
            obj.traverse((child) => {
                if (child instanceof Mesh) {
                    child.castShadow = child.receiveShadow = true
                    texture.colorSpace = SRGBColorSpace
                    child.material.map = texture
                    child.material.toneMapped = false
                }
            })
        }, [obj])

        return (
            <mesh {...props}>
                <primitive object={obj} scale={0.01} rotation={[0, 0, 0]} />
            </mesh>
        )
    /*} catch (err) {
        return (
            <mesh {...props}>
                <boxGeometry />
                <meshStandardMaterial />
            </mesh>
        )
    }*/
    
}

function Scene() {
    const rat = useRef<Mesh>(null);

    useFrame(() => {
        //console.log("rotation: ", camera.rotation.x, camera.rotation.y, camera.rotation.z)
        //console.log("position: ", camera.position.x, camera.position.y, camera.position.z)
        if (rat.current) {
            rat.current.rotation.y += 0.1
        }
    })

    return (
        <>
        <PresentationControls
            snap={true}
            global={true}
            polar={[-Infinity, Infinity]} // Vertical limits
            azimuth={[-Infinity, Infinity]} // Horizontal limits
            damping={0.1}
        >
            <Model ref={rat} />
            <ambientLight intensity={2.5} />
            <directionalLight color="white" position={[5, 5, 5]} />
        </PresentationControls>
        </>
    )
}

export default function Rat(props: any) {
    return (
        <Canvas camera={{ fov: 35, zoom: 0.75, position: [0, 1, 8], rotation: [0, 0, 0] }} {...props}>
            <Scene />
        </Canvas>
    )
}