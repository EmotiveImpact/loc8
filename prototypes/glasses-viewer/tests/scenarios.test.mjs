import test from "node:test";
import assert from "node:assert/strict";
import { scenarios, SCENES } from "../src/data/scenarios.js";
import { destinationForAction } from "../src/model/navigation.js";

test("the viewer exposes exactly sixteen ordered product states", () => {
  assert.equal(scenarios.length, 16);
  assert.deepEqual(
    scenarios.map((scenario) => scenario.order),
    Array.from({ length: 16 }, (_, index) => index + 1),
  );
});

test("scenario identifiers and titles are unique", () => {
  assert.equal(new Set(scenarios.map((scenario) => scenario.id)).size, scenarios.length);
  assert.equal(new Set(scenarios.map((scenario) => scenario.title)).size, scenarios.length);
});

test("every scenario has a valid role, density, scene, actions, and voice commands", () => {
  for (const scenario of scenarios) {
    assert.ok(["guard", "command"].includes(scenario.role), scenario.id);
    assert.ok(["setup", "glance", "operational", "spatial"].includes(scenario.density), scenario.id);
    assert.ok(SCENES[scenario.scene], scenario.id);
    assert.ok(scenario.actions.length >= 2, scenario.id);
    assert.ok(scenario.voiceCommands.length >= 2, scenario.id);
    assert.ok(scenario.eyebrow.startsWith("LOC8"), scenario.id);
  }
});

test("the required 2D and 3D modes exist", () => {
  assert.ok(scenarios.some((scenario) => scenario.viewMode === "site"));
  assert.ok(scenarios.some((scenario) => scenario.viewMode === "floor"));
  assert.ok(scenarios.some((scenario) => scenario.viewMode === "top"));
});

test("spatial and incident actions navigate to the correct operational view", () => {
  assert.equal(destinationForAction("Switch to 2D"), "map-2d");
  assert.equal(destinationForAction("Switch to 3D"), "floor-3d");
  assert.equal(destinationForAction("3D site"), "site-3d");
  assert.equal(destinationForAction("Open incident"), "incident");
  assert.equal(destinationForAction("Pause route"), null);
});
