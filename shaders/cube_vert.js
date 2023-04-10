const cube_vert = `attribute vec3 aVertex;
attribute vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat3 uNMatrix;
uniform vec3 uLightPosition;
uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;
uniform float uLightingModel;
uniform float uShadingModel;
uniform float uAmbientCoeff;
uniform float uc1;
uniform float uc2;

varying vec3 vLightWeighting;
varying vec3 vNormal;
varying vec3 vVertexPositionEye3;

void main() {
  vec4 vertexPositionEye4 = (uView * uModel * vec4(aVertex, 1.0));
  vec3 vertexPositionEye3 = vertexPositionEye4.xyz;
  vec3 dirToLight = normalize(uLightPosition - vertexPositionEye3); // l
  vec3 normal = normalize(uNMatrix * aNormal);
  vec3 reflVec = normalize(reflect(-dirToLight, normal)); // r
  vec3 viewVecEye = -normalize(vertexPositionEye3); // v
  vec3 halfDir = normalize(dirToLight + viewVecEye); // h
  
  if (uShadingModel == 1.0) { // Phong
    vNormal = normal;
    vVertexPositionEye3 = vertexPositionEye3;
  }
  else { // Gouraud
    float d = distance(uLightPosition, vertexPositionEye3);
    float diffLightDot = max(dot(normal,dirToLight),0.0);
    float materialShininess = 16.0;
    
    if (uLightingModel == 0.0) { // Phong
      float specLightDot = max(dot(reflVec,viewVecEye),0.0);
      float specLightParam = pow(specLightDot, materialShininess);
      
      vLightWeighting = uAmbientCoeff * uAmbientLightColor + 
        1.0 / (1.0 + uc1*d + uc2*pow(d,2.0)) * (uDiffuseLightColor * diffLightDot + uSpecularLightColor * specLightParam);
    }
    else if  (uLightingModel == 1.0){ // Lambert
      vLightWeighting = uAmbientCoeff * uAmbientLightColor + 
        1.0 / (1.0 + uc1*d + uc2*pow(d,2.0)) * uDiffuseLightColor * diffLightDot;
    }
    else if  (uLightingModel == 2.0){ // Blinn-Phong
      float specLightDot = max(dot(normal,halfDir),0.0);
      float specLightParam = pow(specLightDot, materialShininess);

      vLightWeighting = uAmbientCoeff * uAmbientLightColor + 
        1.0 / (1.0 + uc1*d + uc2*pow(d,2.0)) * (uDiffuseLightColor * diffLightDot + uSpecularLightColor * specLightParam);
    }
    else if  (uLightingModel == 3.0){ // Toon
      float dirLight = dot(normal,dirToLight);
      float lightInt = smoothstep(0.0, 0.01, dirLight);
      float specLightDot = dot(normal,halfDir);
      float specLightParam = pow(specLightDot * lightInt, 1000.0/materialShininess);
      float specSmooth = smoothstep(0.05, 0.1, specLightParam);

      vLightWeighting = uAmbientCoeff * uAmbientLightColor + 
        1.0 / (1.0 + uc1*d + uc2*pow(d,2.0)) * (uSpecularLightColor * (lightInt + specSmooth));
    }
  }
  gl_Position = uProj * vertexPositionEye4;
}`;

export default cube_vert;