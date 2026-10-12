import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function login(page: Page, name = "Camille") {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Famille Atelier", exact: true })
    .click();
  await page.getByRole("radio", { name: new RegExp(name) }).check();
  const attempt = () =>
    Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/auth/login") &&
          response.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Entrer dans mon espace" }).click(),
    ]);
  let [response] = await attempt();
  if (response.status() === 429) {
    // The complete responsive suite can exceed 20 logins per minute.
    // Respect the real limiter rather than disabling production protection.
    test.setTimeout(95_000);
    await expect(
      page.getByRole("alert").filter({ hasText: "Patiente une minute" }),
    ).toContainText("Patiente une minute");
    await page.waitForTimeout(60_100);
    [response] = await attempt();
  }
  expect(response.ok()).toBe(true);
  await expect(
    page.getByRole("heading", { name: `Bonjour ${name}.` }),
  ).toBeVisible();
}

async function navigate(page: Page, name: string) {
  const sidebar = page
    .locator(".club-sidebar")
    .getByRole("link", { name, exact: true });
  if (await sidebar.isVisible()) {
    await sidebar.click();
    return;
  }
  const mobile = page.getByRole("button", {
    name: "Ouvrir le menu",
    exact: true,
  });
  if (await mobile.isVisible()) {
    await mobile.click();
    await page
      .getByRole("navigation", { name: "Tous les espaces", exact: true })
      .getByRole("link", { name, exact: true })
      .click();
  } else {
    await page
      .getByRole("button", { name: "Rechercher un espace", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Rechercher un espace" })
      .fill(name);
    await page
      .getByRole("navigation", { name: "Résultats de recherche" })
      .getByRole("link")
      .first()
      .click();
  }
}

test("adult: navigation, persistent preferences and goals, family, guided discovery", async ({
  page,
}) => {
  await login(page);
  await navigate(page, "Espace famille");
  await expect(
    page.getByRole("heading", { name: "Noé", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lila", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Sami", { exact: true })).toHaveCount(0);
  await navigate(page, "Préférences");
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
  await navigate(page, "Progression");
  const goal = `[E2E] Lire un chapitre (${test.info().project.name})`;
  const goalButton = page.getByRole("button", { name: goal, exact: true });
  if ((await goalButton.count()) === 0) {
    await page.getByLabel("Un prochain petit pas").fill(goal);
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  }
  await expect(goalButton).toBeVisible();
  if ((await goalButton.getAttribute("aria-pressed")) === "true") {
    await goalButton.click();
    await expect(goalButton).toHaveAttribute("aria-pressed", "false");
  }
  await goalButton.click();
  await expect(page.getByRole("button", { name: goal })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await navigate(page, "Découvertes");
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
    ["Actualités", "Le monde aujourd’hui."],
    ["Lectures", "Mes lectures."],
    ["Studio", "Le studio de Suzanne."],
  ]) {
    await navigate(page, link);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Menu du profil Camille" }).click();
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
  await navigate(page, "Espace famille");
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
  await navigate(page, "Jeux");
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
  await navigate(page, "Jeux");
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
  await navigate(page, "Carnet");
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
  await navigate(page, "Espace famille");
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
  await navigate(page, "Programmes");
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

test("Suzanne is visible before login, with optional motion and voice", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Bonjour, moi c’est Suzanne." }),
  ).toBeVisible();
  await expect(page.locator(".public-portrait img")).toBeVisible();
  const animation = page.getByRole("button", {
    name: "Animer le portrait",
    exact: true,
  });
  await expect(animation).toHaveAttribute("aria-pressed", "false");
  await animation.click();
  await expect(page.locator(".public-portrait")).toHaveClass(/is-animated/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".public-portrait img")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page
    .getByRole("button", { name: "Arrêter l’animation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Écouter Suzanne", exact: true }),
  ).toBeVisible();
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
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});

test("private local profile selection never prefills the demo password", async ({
  page,
}) => {
  await page.route("**/api/demo/accounts", (route) =>
    route.fulfill({
      json: [
        {
          id: "local-example",
          name: "Profil test",
          email: "local-example@local.invalid",
          age: 40,
          role: "guardian",
          household: "Foyer local fictif",
          demo: false,
        },
      ],
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("radio", { name: /Profil test/ })).toBeChecked();
  await expect(
    page.getByLabel("Mot de passe local", { exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByText("Suzanne-demo-2026!", { exact: true }),
  ).toHaveCount(0);
});

test("wardrobe persists per profile, updates the welcome and supports seasonal mode", async ({
  page,
}) => {
  await login(page);
  await navigate(page, "Vestiaire");
  await expect(
    page.getByRole("heading", { name: "Le vestiaire de Suzanne." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Porter la tenue Noël" }).click();
  await expect(
    page.getByRole("button", { name: "Porter la tenue Noël" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Au rythme des saisons")).not.toBeChecked();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Porter la tenue Noël" }),
  ).toHaveAttribute("aria-pressed", "true");
  await navigate(page, "Accueil");
  await expect(page.locator(".welcome-photo img")).toHaveAttribute(
    "alt",
    /Noël/,
  );
  await navigate(page, "Vestiaire");
  await page.getByLabel("Portrait réaliste", { exact: true }).check();
  await navigate(page, "Accueil");
  await expect(page.locator(".welcome-photo img")).toHaveAttribute(
    "alt",
    /personnage fictif/,
  );
  await navigate(page, "Vestiaire");
  await page.getByLabel("Dessin animé", { exact: true }).check();
  await page.getByLabel("Au rythme des saisons").check();
  await expect(page.getByRole("status")).toContainText("mode saisonnier");
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
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  const download = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "Le pack graphique", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("suzanne-pack-v1.zip");
});

test("navigation search, active destination, history and mobile menu are usable", async ({
  page,
}) => {
  await login(page);
  const search = page.getByRole("button", {
    name: "Rechercher un espace",
    exact: true,
  });
  await search.click();
  await page
    .getByRole("textbox", { name: "Rechercher un espace" })
    .fill("tenues");
  await page
    .getByRole("navigation", { name: "Résultats de recherche" })
    .getByRole("link", { name: /Vestiaire/ })
    .click();
  await expect(page).toHaveURL(/#vestiaire$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await navigate(page, "Jeux");
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Le vestiaire de Suzanne." }),
  ).toBeVisible();
  await search.click();
  await page
    .getByRole("textbox", { name: "Rechercher un espace" })
    .fill("zzzxxyy");
  await expect(
    page.getByText("Aucun espace trouvé. Essaie « jeux » ou « cours »."),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(search).toBeFocused();
});
