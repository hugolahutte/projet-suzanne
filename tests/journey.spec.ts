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

test("capitales: two players receive five distinct questions and fair scores", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Jouer ensemble", exact: true }).click();
  await page.getByLabel("Nombre de joueurs").selectOption("2");
  await page.getByRole("button", { name: "Commencer la partie" }).click();
  const seen = new Set<string>();
  const capitals: Record<string, string> = {
    France: "Paris",
    Italie: "Rome",
    Espagne: "Madrid",
    Portugal: "Lisbonne",
    Allemagne: "Berlin",
    Belgique: "Bruxelles",
    Grèce: "Athènes",
    "Royaume-Uni": "Londres",
    Irlande: "Dublin",
    Norvège: "Oslo",
    Suède: "Stockholm",
    Finlande: "Helsinki",
    Danemark: "Copenhague",
    Pologne: "Varsovie",
    Autriche: "Vienne",
    Japon: "Tokyo",
    Canada: "Ottawa",
    Australie: "Canberra",
    Maroc: "Rabat",
    Sénégal: "Dakar",
  };
  for (let i = 0; i < 10; i++) {
    await expect(
      page.getByRole("heading", { name: `À toi, Joueur ${(i % 2) + 1}.` }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Je suis prêt" }).click();
    const country = (await page.locator(".country-name").textContent())!;
    expect(seen.has(country)).toBe(false);
    seen.add(country);
    await page
      .getByLabel("Ta réponse")
      .fill(capitals[country].normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    await page.getByRole("button", { name: "Vérifier ma réponse" }).click();
    await expect(page.getByRole("status")).toContainText("Bien joué");
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
  }
  await expect(
    page.getByRole("heading", { name: "Bravo pour cette exploration !" }),
  ).toBeVisible();
  await expect(page.locator(".score-list p")).toHaveText([
    "Joueur 15 / 5",
    "Joueur 25 / 5",
  ]);
});

test("petit bac: hidden turns and collective validation for four players", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Jouer ensemble", exact: true }).click();
  await page.getByRole("button", { name: /Le petit bac/ }).click();
  await page.getByLabel("Nombre de joueurs").selectOption("4");
  await page.getByRole("button", { name: "Commencer la partie" }).click();
  const letters = "ABCDEFGHLMPRSTV";
  const names = [
    "Alice",
    "Béatrice",
    "Camille",
    "Denis",
    "Émile",
    "Fabien",
    "Gabriel",
    "Hélène",
    "Louis",
    "Marie",
    "Paul",
    "Rose",
    "Sami",
    "Thomas",
    "Victor",
  ];
  const letter = (await page.locator(".game-symbol").textContent())!;
  const name = names[letters.indexOf(letter)];
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Je suis prêt" }).click();
    await expect(page.getByLabel("Prénom", { exact: true })).toHaveValue("");
    await page.getByLabel("Prénom", { exact: true }).fill(name);
    await page.getByRole("button", { name: "Garder mes réponses" }).click();
  }
  await expect(
    page.getByRole("heading", { name: "À vous de vérifier !" }),
  ).toBeVisible();
  const checks = page.locator(".bac-review input:not(:disabled)");
  await expect(checks).toHaveCount(4);
  for (let i = 0; i < 4; i++) await checks.nth(i).check();
  await expect(page.locator(".score-list p")).toHaveText([
    "Joueur 15 points",
    "Joueur 25 points",
    "Joueur 35 points",
    "Joueur 45 points",
  ]);
});

test("notebook persists privately, and live permission stays unavailable", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Mon carnet", exact: true }).click();
  const title = `Lecture fictive ${Date.now()}`;
  await page.getByLabel("Titre", { exact: true }).fill(title);
  await page.getByLabel("Matière ou auteur").fill("Auteur fictif");
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByRole("status")).toContainText("enregistrée");
  await page.reload();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page
    .getByRole("button", { name: `Supprimer ${title}`, exact: true })
    .click();
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
  await page.getByRole("link", { name: "Espace famille" }).click();
  const allow = page.getByLabel("Autoriser le futur mode vidéo dans ce foyer");
  await allow.check();
  await expect(allow).toBeEnabled();
  await page.reload();
  await expect(allow).toBeChecked();
  await expect(
    page.getByText(/Le service vidéo n’est pas encore connecté/),
  ).toBeVisible();
  await allow.uncheck();
  await expect(allow).toBeEnabled();
  await page
    .getByRole("link", { name: "Cours et programmes", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Classe", exact: true })
    .selectOption("4e");
  await page
    .getByRole("combobox", { name: "Matière", exact: true })
    .selectOption("anglais");
  await expect(page.locator(".curriculum-list")).not.toContainText(
    "rentrée 2027",
  );
  await page.getByLabel("Voir aussi les autres années").check();
  await expect(page.locator(".curriculum-list")).toContainText("rentrée 2027");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
