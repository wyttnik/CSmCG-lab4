const cube_frag = `
#ifdef GL_ES 
precision highp float;
#endif

uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform vec3 uColor;
uniform vec3 uLightPosition;
uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;
uniform float uLightingModel;
uniform float uShadingModel;
uniform float uAmbientCoeff;
uniform float uc1;
uniform float uc2;
uniform float uPropCol;
uniform float uPropMat;
uniform float uPropDig;

varying vec2 vTextureCoords;
varying vec3 vLightWeighting;
varying vec3 vNormal;
varying vec3 vVertexPositionEye3;

void main() { 
  vec4 matTex = texture2D(uSampler0, vTextureCoords);
  vec4 digTex = texture2D(uSampler1, vTextureCoords);
  matTex.a *= uPropMat;
  digTex.a *= uPropDig;
  
  if (uShadingModel == 1.0) { // Phong
    float d = distance(uLightPosition, vVertexPositionEye3);
    vec3 dirToLight = normalize(uLightPosition - vVertexPositionEye3); // l
    vec3 normal = normalize(vNormal);
    vec3 reflVec = normalize(reflect(-dirToLight, normal)); // r
    vec3 viewVecEye = -normalize(vVertexPositionEye3); // v
    vec3 halfDir = normalize(dirToLight + viewVecEye); // h
    float diffLightDot = max(dot(normal,dirToLight),0.0);
    float materialShininess = 16.0;
    
    vec3 LightWeighting;
    if (uLightingModel == 0.0) { // Phong
      float specLightDot = max(dot(reflVec,viewVecEye),0.0);
      float specLightParam = pow(specLightDot, materialShininess);
      
      LightWeighting = uAmbientCoeff * uAmbientLightColor + 
        1.0 / (1.0 + uc1*d + uc2*pow(d,2.0)) * (uDiffuseLightColor * diffLightDot + uSpecularLightColor * specLightParam);
    }
    else if (uLightingModel == 1.0){ // Lambert
      LightWeighting = uAmbientCoeff * uAmbientLightColor + 
        1.0 / (1.0 + uc1*d + uc2*pow(d,2.0)) * uDiffuseLightColor * diffLightDot;
    }
    else if (uLightingModel == 2.0){ // Blinn-Phong
      float specLightDot = max(dot(normal,halfDir),0.0);
      float specLightParam = pow(specLightDot, materialShininess);
      
      LightWeighting = uAmbientCoeff * uAmbientLightColor + 
        1.0 / (1.0 + uc1*d + uc2*pow(d,2.0)) * (uDiffuseLightColor * diffLightDot + uSpecularLightColor * specLightParam);
    }
    else if (uLightingModel == 3.0){ // Toon

      vec3 k;
      if (diffLightDot > 0.95) k = vec3(1.0, 1.0, 1.0);
      else if(diffLightDot > 0.75) k = vec3(0.8, 0.8, 0.8);
      else if (diffLightDot > 0.25) k = vec3(0.4,0.4,0.4);
      else k = vec3(0.2, 0.2, 0.2);

      float specLightDot = max(dot(normal,halfDir),0.0);
      float specLightParam = pow(specLightDot, 250.0);

      LightWeighting = k;

      // float dirLight = dot(normal,dirToLight);
      // float lightInt = smoothstep(0.0, 0.01, dirLight);
      // float specLightDot = dot(normal,halfDir);
      // float specLightParam = pow(specLightDot * lightInt, 1000.0/4.0);
      // float specSmooth = smoothstep(0.05, 0.1, specLightParam);
      
      // LightWeighting = k*(uAmbientCoeff * uAmbientLightColor + 
      //   1.0 / (1.0 + uc1*d + uc2*pow(d,2.0)) * (uDiffuseLightColor * diffLightDot + uSpecularLightColor * specLightParam));
    }

    gl_FragColor = vec4(LightWeighting* (digTex.rgb * digTex.a + (matTex.rgb * matTex.a + uColor * (1.0 - matTex.a)) * (1.0 - digTex.a)),1.0);
    // gl_FragColor = vec4(LightWeighting * uColor, 1.0);
  }
  else { // Gouraud

    gl_FragColor = vec4(vLightWeighting* (digTex.rgb * digTex.a + (matTex.rgb * matTex.a + uColor * (1.0 - matTex.a)) * (1.0 - digTex.a)),1.0);
  }
}`;

export default cube_frag;