<div align="center">

# ✈️ AIRPLANE MODE · 3D TOGGLE

<p align="center">
  <b>A cinematic, real-time 3D Airplane Mode UI component built with React 19, Three.js & Vite</b>
</p>

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.185-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.style=for-the-badge)](LICENSE)

---

</div>

## 🌟 Overview

**Airplane Mode 3D** is an interactive web experience that elevates a standard device toggle switch into an immersive, flight simulation sequence. 

When toggled, a procedurally rendered propeller airplane performs a realistic runway acceleration, pitch rotation, landing gear retraction, and high-altitude climb into a day/dusk sky transition.

```
       _____                      
      /  ___|   _   _   ___   _   
      | |___  | | | | / _ \ | |  
      \___  | | |_| |  __/  |_|  
      ____| | \__, | \___|  (_)  
     |______/ |___/              
      TAKEOFF · CRUISING MODE
```

---

## ✨ Key Features

- **🛩️ Procedural 3D Airplane Mesh**: Handcrafted Three.js geometry featuring fuselage, cockpit glass, wings, engines, dual elevators, tail fin, spinning propeller, and dynamic landing gear.
- **🌅 Dynamic Day/Dusk Lighting**: Real-time hemisphere & directional light transitions synchronized with sky fog lerping as the plane ascends.
- **🌾 Instanced Grass Simulation**: High-performance rendering of 2,200 individual grass blades using `THREE.InstancedMesh` around a custom procedural asphalt runway texture.
- **⚙️ Realistic Takeoff Physics & Easing**: Cubic easing curves (`easeInOutCubic`) managing throttle, ground speed, pitch elevation, roll, scale reduction, and shadow fading.
- **🎨 Glassmorphic UI Bar**: Modern, translucent control panel with glowing neon status indicators, status text updates (`GROUNDED · STANDBY` / `TAKEOFF · CRUISING`), and smooth knob animations.
- **🧹 Zero-Leak Memory Management**: Automatic WebGL texture, geometry, and material disposal on component unmount.

---

## 🗂️ Clean Project Structure

```ascii
AirplaneMode/
├── 📁 node_modules/         # Dependencies
├── 📁 src/                  # Core application source
│   ├── 📁 components/       # React 3D Components
│   │   └── ✈️ AirplaneModeToggle.jsx   # Three.js Canvas & Toggle UI Logic
│   ├── ⚛️ App.jsx           # Root Application Wrapper
│   ├── 🎨 index.css         # Global Design Tokens & Scoped UI Styles
│   └── 🚀 main.jsx          # React DOM Entry Point
├── 📄 .gitignore            # Git exclusion rules
├── 📄 .oxlintrc.json        # Fast linter configuration
├── 📄 index.html            # Application HTML shell
├── 📄 package.json          # Dependency specs & scripts
├── 📄 package-lock.json     # Locked dependency versions
├── 📄 README.md             # Project documentation
└── ⚡ vite.config.js        # Vite bundler configuration
```

---

## 🛠️ Tech Stack

| Domain | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [React](https://react.dev/) | `^19.2.8` | Component state & lifecycle management |
| **3D Engine** | [Three.js](https://threejs.org/) | `^0.185.1` | WebGL scene, lighting, meshes & animations |
| **Bundler** | [Vite](https://vitejs.dev/) | `^8.2.0` | Ultra-fast HMR dev server & production bundling |
| **Styling** | Vanilla CSS3 | Custom Tokens | Sora & JetBrains Mono typography, glassmorphic UI |
| **Linter** | [Oxlint](https://oxc.rs/) | `^1.75.0` | High-speed JavaScript & JSX linting |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18.0.0 or higher) installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Yuvi4242/Airplane_modeUI.git
   cd Airplane_modeUI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173` to experience the 3D toggle!

---

## 📜 NPM Scripts Overview

| Command | Action |
| :--- | :--- |
| `npm run dev` | Spawns Vite development server with hot module replacement |
| `npm run build` | Compiles optimized WebGL & React production bundle in `dist/` |
| `npm run preview` | Serves local production build for validation |
| `npm run lint` | Runs `oxlint` static code analysis |

---

## 🔬 Animation & Technical Mechanics

### Takeoff Progression Formula

The takeoff sequence is driven by an interpolated progress variable $p \in [0, 1]$ using a cubic easing function:

$$f(t) = \begin{cases} 4t^3 & \text{if } t < 0.5 \\ 1 - \frac{(-2t + 2)^3}{2} & \text{if } t \ge 0.5 \end{cases}$$

- **Phase 1 ($p < 0.35$):** Runway acceleration, propeller RPM increase, shadow contact tracking.
- **Phase 2 ($p \ge 0.35$):** Pitch angle rotation ($\theta_x \to -0.28\text{ rad}$), altitude lift off, landing gear retraction ($\text{scale} \to 0$), and sky dusk-to-day transition.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">

---
Crafted with ❤️ using **React 19** & **Three.js**

</div>
