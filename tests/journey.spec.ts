import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function login(page: Page, name = "Camille") {
  await page.goto("/");
  await page.getByRole("radio", { name: new RegExp(name) }).check();
  await page.getByRole("button", { name: "Entrer dans mon espace" }).click();
  await expect(
    page.getByRole("heading", { name: `Bonjour ${name}.` }),
  ).toBeVisible();
}

test("adult: navigation, persistent preferences and goals, family, guided discovery", async ({
  page,
}) => {
  await login(page);
  await expect(
    page.getByRole("link", { name: "Espace famille" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Espace famille" }).click();
  await expect(
    page.getByRole("heading", { name: "Noé", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lila", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Sami", { exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Mes préférences" }).click();
  await page
    .getByLabel("Comment veux-tu appeler Suzanne ?")
    .fill("Suzanne test");
  await page
    .getByRole("button", { name: "Enregistrer mes préférences" })
    .click();
  await expect(page.getByRole("status")).toContainText("enregistrées");
  await page.reload();
  await expect(
    page.getByLabel("Comment veux-tu appeler Suzanne ?"),
  ).toHaveValue("Suzanne test");
  await page.getByLabel("Comment veux-tu appeler Suzanne ?").fill("Suzanne");
  await page
    .getByRole("button", { name: "Enregistrer mes préférences" })
    .click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.getByRole("link", { name: "Mes petits pas", exact: true }).click();
  const goal = `Lire un chapitre ${Date.now()}`;
  await page.getByLabel("Un prochain petit pas").fill(goal);
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByRole("button", { name: goal })).toBeVisible();
  await page.getByRole("button", { name: goal }).click();
  await expect(page.getByRole("button", { name: goal })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("link", { name: "Découvertes", exact: true }).click();
  await page.getByRole("button", { name: /Les visages de la Lune/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "De la Lune elle-même", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Un indice");
  await page.getByRole("button", { name: "Du Soleil", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Exactement");
  await page.getByRole("button", { name: "Fermer la découverte" }).click();
  for (const [link, heading] of [
    ["Le monde aujourd’hui", "Le monde aujourd’hui."],
    ["Mes lectures", "Mes lectures."],
    ["Le studio", "Le studio de Suzanne."],
  ]) {
    await page.getByRole("link", { name: link, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page
    .getByRole("button", { name: "Se déconnecter et changer de profil" })
    .click();
  await expect(
    page.getByRole("button", { name: "Entrer dans mon espace" }),
  ).toBeVisible();
});

test("child protection, responsive layout and accessibility", async ({
  page,
}, info) => {
  await login(page, "Noé");
  await expect(
    page.getByText("Qu’est-ce qu’on découvre ensemble aujourd’hui ?"),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Espace famille" })).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `artifacts/${info.project.name}-home.png`,
    fullPage: true,
    scale: "css",
  });
  await page.goto("/#famille");
  await expect(
    page.getByRole("heading", {
      name: "Un espace réservé aux responsables légaux.",
    }),
  ).toBeVisible();
  const response = await page.request.get("/api/households/horizon/dashboard");
  expect(response.status()).toBe(404);
});

test("second household and senior reading size", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Famille Horizon", exact: true })
    .click();
  await page.getByRole("radio", { name: /Rose/ }).check();
  await page.getByRole("button", { name: "Entrer dans mon espace" }).click();
  await expect(
    page.getByRole("heading", { name: "Bonjour Rose." }),
  ).toBeVisible();
  await expect(page.locator(".shell")).toHaveClass(/large-text/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Espace famille" }).click();
  await expect(
    page.getByRole("heading", { name: "Sami", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Noé", exact: true }),
  ).toHaveCount(0);
});

test("PWA manifest and safe offline fallback", async ({ page, context }) => {
  await page.goto("/");
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toHaveLength(2);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const keys = await page.evaluate(async () => {
    const cache = await caches.open("suzanne-public-v1");
    return (await cache.keys()).map((r) => new URL(r.url).pathname);
  });
  expect(keys).toEqual(["/offline.html"]);
  await context.setOffline(true);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Une petite pause." }),
  ).toBeVisible();
  await context.setOffline(false);
});
